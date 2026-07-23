import type { ScreenManager } from '../ui/screen-manager.js';

interface Item { name: string; price: number; }

const CATS: { id: string; name: string; items: Item[] }[] = [
  {
    id: 'trails',
    name: 'Trails',
    items: [
      { name: 'Electric Blue', price: 500 },
      { name: 'Emerald Ember', price: 700 },
      { name: 'Neon Blaze',    price: 1200 },
      { name: 'Aurora',        price: 1500 },
      { name: 'Void Streak',   price: 2500 },
      { name: 'Solar Flare',   price: 3200 },
    ],
  },
  {
    id: 'bullet-trails',
    name: 'Bullet Trails',
    items: [
      { name: 'Standard Glow', price: 300 },
      { name: 'Frost Streak',  price: 800 },
      { name: 'Molten Line',   price: 1400 },
      { name: 'Phase Wire',    price: 2000 },
    ],
  },
  {
    id: 'death',
    name: 'Death Animations',
    items: [
      { name: 'Confetti Pop', price: 600 },
      { name: 'Static Burst', price: 1000 },
      { name: 'Shatter',      price: 1800 },
      { name: 'Nova',         price: 2600 },
    ],
  },
];

export function mountShop(manager: ScreenManager): void {
  const catList = document.getElementById('shop-cats');
  const itemGrid = document.getElementById('shop-items');
  const catTitle = document.getElementById('shop-cat-title');
  const balance = document.getElementById('shop-coins');
  if (!catList || !itemGrid || !catTitle) return;

  if (balance) balance.textContent = '3,240';

  catList.innerHTML = CATS.map(
    (c, i) => `<div class="shop-cat${i === 0 ? ' is-active' : ''}" data-cat="${c.id}">${c.name}</div>`,
  ).join('');

  const showCat = (id: string): void => {
    const cat = CATS.find((c) => c.id === id) ?? CATS[0];
    if (!cat) return;
    catTitle.textContent = cat.name;
    catList.querySelectorAll<HTMLElement>('.shop-cat').forEach((el) => {
      el.classList.toggle('is-active', el.dataset['cat'] === cat.id);
    });
    itemGrid.innerHTML = cat.items
      .map(
        (it) => `
      <div class="item-card">
        <div class="item-preview">${cat.name}</div>
        <div class="item-name">${it.name}</div>
        <div class="item-buyrow">
          <span class="item-price">${it.price.toLocaleString()}</span>
          <button class="mini-btn is-primary" type="button">Buy</button>
        </div>
      </div>`,
      )
      .join('');
  };

  catList.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.shop-cat');
    if (!el?.dataset['cat']) return;
    showCat(el.dataset['cat']);
  });

  if (CATS[0]) showCat(CATS[0].id);

  document.querySelectorAll<HTMLButtonElement>('#screen-shop [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });
}
