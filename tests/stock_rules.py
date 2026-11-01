"""Business invariants exercised against the actual SQLite migration."""
import glob, sqlite3, unittest, uuid

class StockRules(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys = ON')
        for file in sorted(glob.glob('drizzle/*.sql')):
            with open(file) as migration: self.db.executescript(migration.read())
        self.db.execute("INSERT INTO streets (name,floor) VALUES ('A',NULL)")
        self.db.execute("INSERT INTO products VALUES ('p','TV','001234','00456')")
        self.db.execute("INSERT INTO codes VALUES ('001234','p')")
        self.db.execute("INSERT INTO codes VALUES ('00456','p')")
    def op(self, kind, qty, source=None, destination=None, reason=None, id=None):
        self.db.execute('INSERT INTO operations (id,product_id,kind,quantity,source,destination,reason,payload) VALUES (?,?,?,?,?,?,?,?)',(id or str(uuid.uuid4()),'p',kind,qty,source,destination,reason,'{}'))
    def balance(self,location):
        row=self.db.execute('SELECT quantity FROM balances WHERE product_id=? AND location=?',('p',location)).fetchone()
        return row[0] if row else 0
    def test_separate_locations_and_total(self):
        self.op('entry',6,destination='estoque:A'); self.op('add',1,destination='mostruario')
        self.assertEqual(self.balance('estoque:A'),6); self.assertEqual(self.balance('mostruario'),1)
    def test_move_preserves_total_and_merges_destination(self):
        self.op('entry',6,destination='estoque:A'); self.op('add',1,destination='salao')
        self.op('move',3,source='estoque:A',destination='salao')
        self.assertEqual((self.balance('estoque:A'),self.balance('salao')),(3,4))
    def test_oversized_move_is_atomic(self):
        self.op('entry',2,destination='estoque:A')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'INSUFFICIENT_STOCK'): self.op('move',3,source='estoque:A',destination='salao')
        self.assertEqual((self.balance('estoque:A'),self.balance('salao')),(2,0))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM operations').fetchone()[0],1)
    def test_stale_second_removal_cannot_overdraw(self):
        self.op('entry',5,destination='salao'); self.op('remove',4,source='salao',reason='Venda')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'INSUFFICIENT_STOCK'): self.op('remove',4,source='salao',reason='Venda')
        self.assertEqual(self.balance('salao'),1)
    def test_zero_hidden_and_entry_reactivates(self):
        self.op('entry',2,destination='salao'); self.op('remove',2,source='salao',reason='Avaria')
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM balances WHERE quantity>0').fetchone()[0],0)
        with self.assertRaisesRegex(sqlite3.IntegrityError,'ZERO_STOCK'): self.op('add',1,destination='salao')
        self.op('entry',3,destination='salao'); self.assertEqual(self.balance('salao'),3)
    def test_reason_required(self):
        self.op('entry',2,destination='mostruario')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'REASON_REQUIRED'): self.op('remove',1,source='mostruario')
    def test_positive_integer_and_same_location(self):
        self.op('entry',2,destination='salao')
        with self.assertRaises(sqlite3.IntegrityError): self.op('entry',0,destination='salao')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'SAME_LOCATION'): self.op('move',1,source='salao',destination='salao')
    def test_duplicate_request_cannot_change_balance(self):
        self.op('entry',2,destination='salao',id='once')
        with self.assertRaises(sqlite3.IntegrityError): self.op('entry',2,destination='salao',id='once')
        self.assertEqual(self.balance('salao'),2)
    def test_codes_preserve_leading_zero_and_prevent_cross_collision(self):
        self.assertEqual(self.db.execute("SELECT product_id FROM codes WHERE code='001234'").fetchone()[0],'p')
        self.db.execute("INSERT INTO products VALUES ('q','Fogão','987','001234')")
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("INSERT INTO codes VALUES ('001234','q')")

    def test_only_registered_streets_accept_stock(self):
        for kind in ['entry', 'add', 'move']:
            self.op('entry', 2, destination='salao')
            before=self.db.execute('SELECT COUNT(*) FROM operations').fetchone()[0]
            with self.assertRaisesRegex(sqlite3.IntegrityError, 'UNKNOWN_STREET'):
                self.op(kind, 1, source='salao' if kind=='move' else None, destination='estoque:RUA 4')
            self.assertEqual(self.balance('estoque:RUA 4'),0)
            self.assertEqual(self.db.execute('SELECT COUNT(*) FROM operations').fetchone()[0],before)
    def test_street_with_optional_floor_and_registered_destination(self):
        self.db.execute("INSERT INTO streets (name,floor) VALUES ('RUA 1','2º andar')")
        self.db.execute("INSERT INTO streets (name,floor) VALUES ('RUA 2',NULL)")
        self.op('entry',3,destination='estoque:RUA 1')
        self.op('move',2,source='estoque:RUA 1',destination='estoque:RUA 2')
        self.assertEqual((self.balance('estoque:RUA 1'),self.balance('estoque:RUA 2')),(1,2))
        self.assertEqual(self.db.execute("SELECT floor FROM streets WHERE name='RUA 1'").fetchone()[0],'2º andar')
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO streets (name,floor) VALUES ('RUA 1','3º andar')")
    def test_unregistered_street_rolls_back_new_product_batch(self):
        self.db.commit()
        with self.assertRaisesRegex(sqlite3.IntegrityError, 'UNKNOWN_STREET'):
            with self.db:
                self.db.execute("INSERT INTO products VALUES ('new','Fogão','987','654')")
                self.db.execute("INSERT INTO codes VALUES ('987','new')")
                self.db.execute("INSERT INTO operations (id,product_id,kind,quantity,destination,payload) VALUES ('invalid-entry','new','entry',1,'estoque:RUA 4','{}')")
        self.assertIsNone(self.db.execute("SELECT id FROM products WHERE id='new'").fetchone())
        self.assertIsNone(self.db.execute("SELECT code FROM codes WHERE code='987'").fetchone())

if __name__ == '__main__': unittest.main()
