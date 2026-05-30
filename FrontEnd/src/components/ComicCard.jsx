import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCommentDots, faHeart } from '@fortawesome/free-solid-svg-icons';

export default function ComicCard({ item }) {
  return (
    <article className="comic-card">
      <img className="comic-thumb" src={item.image} alt={item.title} loading="lazy" />
      <div className="comic-meta"><FontAwesomeIcon icon={faEye} /> {item.views}  <FontAwesomeIcon icon={faCommentDots} /> {item.comments}  <FontAwesomeIcon icon={faHeart} /> {item.follows}</div>
      <div className="comic-content">
        <h3>{item.title}</h3>
        <ul>
          {item.chapters.map((chapter) => (
            <li key={`${item.title}-${chapter.name}`}>
              <a href="#">{chapter.name}</a>
              <span>{chapter.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
