/* Автокомплекс 15. Один счётчик, две цели без двойных обработчиков.
   В Метрике создайте цели «Целевое событие / JavaScript-событие»:
   phone_click и route_click. Номер счётчика задаётся в config.js. */
(() => {
  'use strict';
  const id = Number(window.YM_COUNTER_ID);
  const enabled = Number.isInteger(id) && id > 0;
  const debug = new URLSearchParams(window.location.search).get('analytics_debug') === '1';
  if (enabled) {
    (function(m,e,t,r,i,k,a) {
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (let j=0;j<document.scripts.length;j++) if(document.scripts[j].src===r) return;
      k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;
      a.parentNode.insertBefore(k,a);
    })(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
    window.ym(id,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});
  }
  function goal(name, link) {
    const params = {
      branch: 'semashko15', city: 'Петропавловск',
      address: 'Петропавловск, улица Семашко, 15',
      button_text: link.textContent.trim(),
      placement: link.closest('header') ? 'header' : link.closest('.mobile-bar') ? 'mobile_bar' : link.closest('section')?.id || 'footer'
    };
    if(name === 'phone_click') params.phone = '+77077477724';
    if(debug) console.info('[Метрика: проверка]', name, params, enabled ? 'счётчик подключён' : 'счётчик отключён');
    if(!enabled || typeof window.ym !== 'function') return;
    try { window.ym(id,'reachGoal',name,params); } catch(error) {
      if(debug) console.warn('[Метрика]',error);
    }
  }
  // Цель 1: все телефонные ссылки, включая шапку и нижнюю панель.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="tel:"]');
    if(link) goal('phone_click',link);
  });
  // Цель 2: все кнопки маршрута. Обычный переход по ссылке не блокируется.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-goal="route_click"]');
    if(link) goal('route_click',link);
  });
})();
