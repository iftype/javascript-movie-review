import { getThumbnailImageUrl } from '../../api/renderImage.ts';
import { $ } from '../../utils/dom.ts';
import { Star } from '../common/Star.ts';
import { MovieData } from '../../api/types.ts';

export const MovieItem = (data: MovieData) => {
  const { title, poster_path, vote_average } = data;
  console.log(vote_average);
  const $li = document.createElement('li');

  $li.innerHTML = `
    <div class="item">
      <img class="thumbnail" alt="" />
      <div class="item-desc">
        <p class="rate">
          <span></span>
        </p>
        <strong></strong>
      </div>
    </div>
  `;

  const $img = $<HTMLImageElement>($li, '.thumbnail');
  $img.src = getThumbnailImageUrl(poster_path);

  $img.onerror = () => {
    $img.src = './images/empty.png';
  };

  $($li, '.item-desc strong').textContent = title;
  $($li, 'span').textContent = vote_average ? vote_average.toFixed(1) : '평가 중';
  $($li, '.rate').prepend(Star());

  return $li;
};
