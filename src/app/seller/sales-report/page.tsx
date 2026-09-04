'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft, BarChart3, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SaleOrder {
  id: string;
  buyerId?: string;
  buyerName?: string;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{ productTitle?: string; quantity?: number }>;
  totalAmount?: number;
  deliveryAddress?: string;
  paymentMethod?: string;
  status?: string;
  createdAt?: any;
}

interface Buyer {
  username?: string;
  displayName?: string;
  name?: string;
  email?: string;
}

const formatDate = (value: any) => {
  if (!value) return 'Date unavailable';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

const formatAmount = (amount?: number) => `${Number(amount || 0).toLocaleString()} MMK`;

export default function SellerSalesReportPage() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [buyers, setBuyers] = useState<Record<string, Buyer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push('/login');
      return;
    }
    const userSnapshot = await getDoc(doc(db, 'users', user.uid));
    if (!userSnapshot.exists() || !['seller', 'VENDOR'].includes(userSnapshot.data().role)) {
      router.push('/');
      return;
    }
    setSellerId(user.uid);
  }), [router]);

  useEffect(() => {
    if (!sellerId) return;
    const salesQuery = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
    return onSnapshot(salesQuery, (snapshot) => {
      const confirmedSales = snapshot.docs
        .map((saleSnapshot) => ({ id: saleSnapshot.id, ...saleSnapshot.data() } as SaleOrder))
        .filter((sale) => sale.status === 'CONFIRMED' || sale.status === 'DELIVERED')
        .sort((first, second) => {
          const firstTime = first.createdAt?.toMillis?.() || new Date(first.createdAt || 0).getTime();
          const secondTime = second.createdAt?.toMillis?.() || new Date(second.createdAt || 0).getTime();
          return secondTime - firstTime;
        });
      setSales(confirmedSales);
      setLoading(false);
      setError('');
    }, (snapshotError) => {
      console.error('Failed to load sales report:', snapshotError);
      setError('Unable to load sales report.');
      setLoading(false);
    });
  }, [sellerId]);

  useEffect(() => {
    const buyerIds = [...new Set(sales.map((sale) => sale.buyerId).filter(Boolean))] as string[];
    if (buyerIds.length === 0) return;

    Promise.all(buyerIds.map(async (buyerId) => [buyerId, await getDoc(doc(db, 'users', buyerId))] as const))
      .then((results) => {
        const nextBuyers: Record<string, Buyer> = {};
        results.forEach(([buyerId, snapshot]) => {
          if (snapshot.exists()) nextBuyers[buyerId] = snapshot.data() as Buyer;
        });
        setBuyers((current) => ({ ...current, ...nextBuyers }));
      })
      .catch((buyerError) => console.error('Failed to load buyer information:', buyerError));
  }, [sales]);

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalItems = sales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Link href="/seller/dashboard" style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={24} /> Sales Report</h1>
        </header>

        {loading ? <p style={{ color: '#a1a1aa' }}>Loading sales...</p> : error ? <p style={{ color: '#f87171' }}>{error}</p> : (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '10px', padding: '16px' }}><div style={{ color: '#a1a1aa', fontSize: '13px' }}>Completed orders</div><strong style={{ display: 'block', marginTop: '6px', fontSize: '24px' }}>{sales.length}</strong></div>
              <div style={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '10px', padding: '16px' }}><div style={{ color: '#a1a1aa', fontSize: '13px' }}>Items sold</div><strong style={{ display: 'block', marginTop: '6px', fontSize: '24px' }}>{totalItems}</strong></div>
              <div style={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '10px', padding: '16px' }}><div style={{ color: '#a1a1aa', fontSize: '13px' }}>Total sales</div><strong style={{ display: 'block', marginTop: '6px', fontSize: '24px', color: '#38bdf8' }}>{formatAmount(totalRevenue)}</strong></div>
            </section>

            {sales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '12px', color: '#a1a1aa' }}>
                <ClipboardList size={42} style={{ color: '#52525b', marginBottom: '12px' }} />
                <p style={{ margin: 0 }}>No confirmed sales yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '12px' }}>
                <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead><tr style={{ color: '#a1a1aa', borderBottom: '1px solid #2f2f2f' }}>{['Buyer', 'Phone', 'Items', 'Date', 'Total', 'Delivery address', 'Payment'].map((heading) => <th key={heading} style={{ padding: '14px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{heading}</th>)}</tr></thead>
                  <tbody>{sales.map((sale) => {
                    const buyer = sale.buyerId ? buyers[sale.buyerId] : undefined;
                    const buyerName = sale.buyerName || sale.customerName || buyer?.username || buyer?.displayName || buyer?.name || buyer?.email || sale.buyerId || 'Buyer';
                    return <tr key={sale.id} style={{ borderBottom: '1px solid #27272a' }}>
                    <td style={{ padding: '14px 12px', color: '#fff', fontWeight: 600 }}>{buyerName}</td>
                    <td style={{ padding: '14px 12px', color: '#d4d4d8', whiteSpace: 'nowrap' }}>{sale.customerPhone || 'Not provided'}</td>
                    <td style={{ padding: '14px 12px', color: '#d4d4d8', minWidth: '180px' }}>{(sale.items || []).map((item, index) => <div key={`${sale.id}-${index}`}>{item.productTitle || 'Product'} x {item.quantity || 0}</div>)}</td>
                    <td style={{ padding: '14px 12px', color: '#a1a1aa', whiteSpace: 'nowrap' }}>{formatDate(sale.createdAt)}</td>
                    <td style={{ padding: '14px 12px', color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatAmount(sale.totalAmount)}</td>
                    <td style={{ padding: '14px 12px', color: '#d4d4d8', maxWidth: '220px' }}>{sale.deliveryAddress || 'Not provided'}</td>
                    <td style={{ padding: '14px 12px', color: '#d4d4d8', whiteSpace: 'nowrap' }}>{sale.paymentMethod || 'Not provided'}</td>
                  </tr>})}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
