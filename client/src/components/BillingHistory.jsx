import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Download, Receipt, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

export default function BillingHistory({ setView }) {
  const { user, subscription } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort in memory by date to avoid requiring a composite Firestore index
        list.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        });

        setTransactions(list);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Unable to load billing history ledger.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const downloadReceiptPDF = (tx) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Logo & Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(10, 22, 40); // Navy Blue
    doc.text("Economical Research", 20, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Global Economic Intelligence. Powered by Research.", 20, 31);
    doc.text("er-news-sarvesh.vercel.app", 20, 36);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(10, 22, 40);
    doc.text("BILLING STATEMENT / RECEIPT", 20, 50);

    // separator
    doc.setDrawColor(212, 175, 55); // Gold
    doc.setLineWidth(0.5);
    doc.line(20, 53, 190, 53);

    // Bill details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    let y = 62;
    const addField = (label, val) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(val), 70, y);
      y += 8;
    };

    const dateVal = tx.date?.toDate 
      ? tx.date.toDate().toLocaleDateString() 
      : new Date(tx.date).toLocaleDateString();

    addField("Subscriber Name:", tx.userName || "Subscriber");
    addField("Subscriber Email:", tx.userEmail || "");
    addField("Subscribed Plan:", tx.plan || "ER PRO");
    addField("Amount Paid:", `INR ${tx.amount || 399}.00`);
    addField("Payment Gateway:", "Razorpay Secure");
    addField("Payment ID:", tx.paymentId || "N/A");
    addField("Order ID:", tx.orderId || "N/A");
    addField("Payment Date:", dateVal);
    addField("Billing Cycle:", tx.billingCycle || "monthly");
    addField("Status:", tx.status?.toUpperCase() || "SUCCESS");

    // separator
    doc.setDrawColor(220, 220, 220);
    doc.line(20, y + 5, 190, y + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Thank you for your premium subscription to Economical Research PRO.", 20, y + 12);
    doc.text("For any support inquiries, contact sarveshdusane7807@gmail.com", 20, y + 17);

    doc.save(`receipt-${tx.paymentId || tx.id}.pdf`);
  };

  return (
    <div class="max-w-4xl mx-auto px-4 py-8 font-sans">
      {/* Back navigation */}
      <button 
        onClick={() => setView('billing')}
        class="flex items-center gap-1 text-xs font-bold text-navy dark:text-gold uppercase tracking-wider mb-6 hover:opacity-85"
      >
        <ArrowLeft size={14} /> Back to Pricing
      </button>

      {/* Page Header */}
      <div class="border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
        <h2 class="font-serif text-2xl md:text-3xl font-black text-navy dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Receipt class="text-gold w-6 h-6" /> In-App Billing History
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-455 mt-1 font-serif">
          Ledger of transactions, payments, and premium access receipts.
        </p>
      </div>

      {/* Current Subscription Summary */}
      <div class="glass-card p-5 rounded-2xl border border-gold/15 mb-8 bg-navy/5 dark:bg-white/5">
        <h3 class="text-xs font-bold uppercase tracking-wider text-navy dark:text-gold mb-3 flex items-center gap-1.5 font-mono">
          <ShieldCheck size={14} class="text-gold" /> Active Credentials
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-serif">
          <div>
            <span class="text-gray-400 block mb-0.5">Tier status</span>
            <span class="font-bold text-navy dark:text-white">{subscription?.tier || 'Basic'}</span>
          </div>
          <div>
            <span class="text-gray-400 block mb-0.5">Renewal Cycle</span>
            <span class="font-bold text-navy dark:text-white capitalize">{subscription?.plan || 'monthly'}</span>
          </div>
          <div>
            <span class="text-gray-400 block mb-0.5">Expires / Renews</span>
            <span class="font-bold text-navy dark:text-white">
              {subscription?.expiresAt 
                ? new Date(subscription.expiresAt).toLocaleDateString() 
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table Ledger */}
      {loading ? (
        <div class="py-12 flex flex-col items-center justify-center text-gray-400">
          <div class="animate-spin h-6 w-6 border-2 border-double border-gold rounded-full mb-2"></div>
          <span class="text-[10px] font-mono tracking-widest uppercase">RETRIEVING LEDGER DATA...</span>
        </div>
      ) : error ? (
        <div class="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-755 dark:text-red-300 p-4 rounded-xl text-xs font-semibold">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      ) : transactions.length === 0 ? (
        <div class="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <Receipt class="mx-auto text-gray-450 w-8 h-8 opacity-40 mb-3" />
          <h4 class="font-bold text-sm text-navy dark:text-gray-200">No Transactions Found</h4>
          <p class="text-[11px] text-gray-500 dark:text-gray-455 mt-1 max-w-xs mx-auto leading-normal">
            You do not have any past premium payment records in our secure database yet.
          </p>
        </div>
      ) : (
        <div class="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-navy/40 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 uppercase tracking-widest font-mono text-[9px]">
                <th class="p-4 font-bold">Date</th>
                <th class="p-4 font-bold">Plan</th>
                <th class="p-4 font-bold">Amount</th>
                <th class="p-4 font-bold">Payment ID</th>
                <th class="p-4 font-bold text-center">Receipt</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-white/10">
              {transactions.map((tx) => {
                const dateString = tx.date?.toDate 
                  ? tx.date.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                  : new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                return (
                  <tr key={tx.id} class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors font-serif">
                    <td class="p-4 whitespace-nowrap">
                      <span class="flex items-center gap-1.5 font-bold">
                        <Calendar size={12} class="text-gold" />
                        {dateString}
                      </span>
                    </td>
                    <td class="p-4 font-sans font-bold text-navy dark:text-gray-200 whitespace-nowrap">
                      {tx.plan || 'ER PRO'} <span class="text-[9px] px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 capitalize font-medium">{tx.billingCycle || 'monthly'}</span>
                    </td>
                    <td class="p-4 font-sans font-extrabold text-navy dark:text-white whitespace-nowrap">
                      ₹{tx.amount || 399}
                    </td>
                    <td class="p-4 font-mono text-gray-500 text-[10px] whitespace-nowrap select-all">
                      {tx.paymentId || 'N/A'}
                    </td>
                    <td class="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => downloadReceiptPDF(tx)}
                        class="share-inline-btn mx-auto"
                        title="Download Invoice PDF"
                      >
                        <Download size={10} /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
