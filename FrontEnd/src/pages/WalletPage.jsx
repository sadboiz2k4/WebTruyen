import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowRightArrowLeft, faMinus } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createMoMoPaymentApi,
  createVnPayPaymentApi,
  depositWalletApi,
  getWalletBalanceApi,
  getWalletTransactionsApi,
} from '../services/walletApi';

const PACKAGES = [
  { label: '10,000 xu', amountVnd: 10000 },
  { label: '50,000 xu', amountVnd: 50000 },
  { label: '100,000 xu', amountVnd: 100000 },
  { label: '200,000 xu', amountVnd: 200000 },
];

export default function WalletPage() {
  const [searchParams] = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [vnpayLoading, setVnpayLoading] = useState(null);
  const [momoLoading, setMomoLoading] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const xu = searchParams.get('xu');
    if (payment === 'success') {
      setMessage(`Nạp tiền thành công! +${xu ? Number(xu).toLocaleString() : ''} xu`);
      setIsError(false);
    } else if (payment === 'failed') {
      setMessage('Thanh toán thất bại hoặc bị hủy.');
      setIsError(true);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [balanceData, txData] = await Promise.all([
        getWalletBalanceApi(),
        getWalletTransactionsApi(50),
      ]);
      setBalance(typeof balanceData === 'number' ? balanceData : (balanceData?.balance ?? 0));
      setTransactions(Array.isArray(txData) ? txData : (txData?.content ?? []));
    } catch (error) {
      setMessage('Không thể tải dữ liệu ví: ' + error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVnPayDeposit = async (amountVnd) => {
    setVnpayLoading(amountVnd);
    setMessage('');
    setIsError(false);
    try {
      const data = await createVnPayPaymentApi(amountVnd);
      window.location.href = data.paymentUrl;
    } catch (err) {
      setMessage('Lỗi tạo thanh toán: ' + err.message);
      setIsError(true);
      setVnpayLoading(null);
    }
  };

  const handleMoMoDeposit = async (amountVnd) => {
    setMomoLoading(amountVnd);
    setMessage('');
    setIsError(false);
    try {
      const data = await createMoMoPaymentApi(amountVnd);
      window.location.href = data.paymentUrl;
    } catch (err) {
      setMessage('Lỗi tạo thanh toán MoMo: ' + err.message);
      setIsError(true);
      setMomoLoading(null);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      setMessage('Vui lòng nhập số tiền hợp lệ');
      setIsError(true);
      return;
    }
    try {
      setMessage('');
      setIsError(false);
      await depositWalletApi(parseInt(amount), reason || 'Nạp xu');
      setAmount('');
      setReason('');
      setShowDepositForm(false);
      setMessage('Nạp xu thành công!');
      setIsError(false);
      await loadWalletData();
    } catch (error) {
      setMessage('Lỗi nạp xu: ' + error.message);
      setIsError(true);
    }
  };


  return (
    <div className="page wallet-page">
      <Header />
      <div className="container">

        <main className="wallet-main">
          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Ví Xu</span>
          </div>

          <section className="wallet-content">
            <h1>Ví Xu Của Bạn</h1>

            {loading ? (
              <div className="wallet-loading">Đang tải...</div>
            ) : (
              <>
                <div className="wallet-balance-card">
                  <div className="wallet-balance-value">{balance.toLocaleString()} Xu</div>
                  <div className="wallet-balance-label">Số dư hiện tại</div>
                </div>

                {message && (
                  <div className={`wallet-message ${isError ? 'error' : 'success'}`}>
                    {message}
                  </div>
                )}

                {/* Step 1: Chọn mức nạp */}
                <section className="vnpay-section">
                  <h2 className="vnpay-title">Chọn mức nạp</h2>
                  <p className="vnpay-desc">1 VND = 1 xu</p>
                  <div className="vnpay-packages">
                    {PACKAGES.map((pkg) => (
                      <button
                        key={pkg.amountVnd}
                        type="button"
                        className={`vnpay-pkg-btn${selectedAmount === pkg.amountVnd ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedAmount(pkg.amountVnd);
                          setMessage('');
                        }}
                      >
                        <span className="vnpay-pkg-xu">{pkg.label}</span>
                        <span className="vnpay-pkg-vnd">{pkg.amountVnd.toLocaleString()} VND</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Step 2: Chọn cổng thanh toán */}
                {selectedAmount && (
                  <section className="vnpay-section gateway-section">
                    <h2 className="vnpay-title">Chọn cổng thanh toán</h2>
                    <p className="vnpay-desc">
                      Bạn đang nạp <strong>{selectedAmount.toLocaleString()} xu</strong> — chọn phương thức thanh toán
                    </p>
                    <div className="gateway-options">
                      <button
                        type="button"
                        className="gateway-btn gateway-btn--vnpay"
                        disabled={vnpayLoading !== null || momoLoading !== null}
                        onClick={() => handleVnPayDeposit(selectedAmount)}
                      >
                        <span className="gateway-name">VNPay</span>
                        <span className="gateway-desc">Thẻ ATM / Internet Banking / QR</span>
                        {vnpayLoading === selectedAmount && <span className="vnpay-pkg-loading"> ⏳</span>}
                      </button>
                      <button
                        type="button"
                        className="gateway-btn gateway-btn--momo"
                        disabled={momoLoading !== null || vnpayLoading !== null}
                        onClick={() => handleMoMoDeposit(selectedAmount)}
                      >
                        <span className="gateway-name">MoMo</span>
                        <span className="gateway-desc">Ví điện tử MoMo</span>
                        {momoLoading === selectedAmount && <span className="vnpay-pkg-loading"> ⏳</span>}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="gateway-back-btn"
                      onClick={() => setSelectedAmount(null)}
                    >
                      ← Chọn lại mức nạp
                    </button>
                  </section>
                )}

                {showDepositForm && (
                  <form className="wallet-form" onSubmit={handleDeposit}>
                    <h3>Nạp Xu (thủ công)</h3>
                    <input
                      type="number"
                      placeholder="Số tiền (xu)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Lý do (tùy chọn)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <button type="submit">Nạp Ngay</button>
                    <button type="button" onClick={() => setShowDepositForm(false)}>Hủy</button>
                  </form>
                )}

                <section className="wallet-transactions">
                  <h2>Lịch sử giao dịch</h2>
                  {transactions.length === 0 ? (
                    <p className="empty-text">Không có giao dịch nào</p>
                  ) : (
                    <div className="transactions-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Loại</th>
                            <th>Số tiền</th>
                            <th>Lý do</th>
                            <th>Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <tr key={tx.transactionId}>
                              <td className={`tx-type tx-${tx.type?.toLowerCase()}`}>
                                {tx.type === 'DEPOSIT' ? <><FontAwesomeIcon icon={faPlus} /> Nạp</> : tx.type === 'TRANSFER' ? <><FontAwesomeIcon icon={faArrowRightArrowLeft} /> Chuyển</> : <><FontAwesomeIcon icon={faMinus} /> Rút</>}
                              </td>
                              <td className={`tx-amount ${tx.type === 'DEPOSIT' ? 'positive' : 'negative'}`}>
                                {tx.type === 'DEPOSIT' ? '+' : '-'}{(tx.amount || 0).toLocaleString()}
                              </td>
                              <td>{tx.reason || tx.description || '-'}</td>
                              <td>{tx.createdAt || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
