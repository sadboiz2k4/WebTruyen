import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RankingBox({ topMonth = [] }) {
  const [activeTab, setActiveTab] = useState('month');

  const topWeek = topMonth.slice().sort(() => Math.random() - 0.5);
  const topDay = topMonth.slice().sort(() => Math.random() - 0.5);

  const getDisplayData = () => {
    switch (activeTab) {
      case 'week': return topWeek;
      case 'day': return topDay;
      default: return topMonth;
    }
  };

  const displayData = getDisplayData();

  return (
    <aside className="ranking-box">
      <div className="ranking-tabs">
        <button className={activeTab === 'month' ? 'active' : ''} type="button" onClick={() => setActiveTab('month')}>
          Top Tháng
        </button>
        <button className={activeTab === 'week' ? 'active' : ''} type="button" onClick={() => setActiveTab('week')}>
          Top Tuần
        </button>
        <button className={activeTab === 'day' ? 'active' : ''} type="button" onClick={() => setActiveTab('day')}>
          Top Ngày
        </button>
      </div>
      <ul className="ranking-list">
        {displayData.map((item) => (
          <li key={item.no}>
            <span className="rank-no">{item.no}</span>
            <img className="rank-thumb" src={item.image} alt={item.title} loading="lazy" />
            <div className="rank-detail">
              <Link to={`/chi-tiet-truyen/${item.slug}`}>{item.title}</Link>
              <p>
                <span>{item.chapter}</span>
                <strong>{item.views}</strong>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
