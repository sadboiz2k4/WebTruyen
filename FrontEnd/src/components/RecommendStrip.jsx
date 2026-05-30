import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCommentDots } from '@fortawesome/free-solid-svg-icons';

export default function RecommendStrip({ items }) {
  return (
    <section className="recommend-strip">
      <div className="section-title">
        <h2>Truyện đề cử</h2>
        <a href="#">Trước Sau</a>
      </div>
      <div className="recommend-items">
        {items.map((item) => (
          <article key={item.id || item.title} className="recommend-card">
            <Link to={`/chi-tiet-truyen/${item.slug}`}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <h3>{item.title}</h3>
              {item.description && <p className="recommend-desc">{item.description.length > 80 ? item.description.slice(0, 80) + '…' : item.description}</p>}
              <div className="recommend-stats">
                {item.totalViews > 0 && <span><FontAwesomeIcon icon={faEye} /> {Number(item.totalViews).toLocaleString()}</span>}
                <span><FontAwesomeIcon icon={faCommentDots} /> {item.totalComments || 0}</span>
              </div>
              <p>
                <span>{item.chapter}</span>
                <span>{item.time}</span>
              </p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
