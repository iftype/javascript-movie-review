import { MovieData } from '../../api/types.ts';
import { $ } from '../../utils/dom.ts';
import { Star } from '../common/Star.ts';

export const TopRate = (data: MovieData): HTMLElement => {
  const $container = document.createElement('div');
  $container.className = 'top-rated-movie';

  $container.innerHTML = `
    <div class="title"></div>
    <div class="rate">
      <span class="rate-value"></span>
    </div>
    <button class="primary detail">자세히 보기</button>
  `;

  $($container, '.rate').prepend(Star());
  $($container, '.title').textContent = data.title;
  const { vote_average } = data;
  $($container, '.rate-value').textContent = vote_average ? vote_average.toFixed(1) : '평가 중';

  return $container;
};
