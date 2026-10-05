// Apply at the editor boundary so every plugin's preview and delivery agree.
const lockedKeys = new Set(['width', 'initial-scale', 'minimum-scale', 'maximum-scale', 'user-scalable']);
const guard = `<style data-novvy-fixed-viewport>html,body{touch-action:pan-x pan-y!important}</style>
<script data-novvy-fixed-viewport>(function(){
  function preventGesture(event){if(event.cancelable)event.preventDefault();}
  function preventMultiTouch(event){if(event.touches.length>1)preventGesture(event);}
  var options={passive:false,capture:true};
  document.addEventListener('gesturestart',preventGesture,options);
  document.addEventListener('gesturechange',preventGesture,options);
  document.addEventListener('touchstart',preventMultiTouch,options);
  document.addEventListener('touchmove',preventMultiTouch,options);
})();</script>`;

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? match[1] ?? match[2] ?? match[3] : '';
}

export function fixedViewportHtml(html) {
  if (html.includes('data-novvy-fixed-viewport')) return html;
  const extras = new Map();
  html = html.replace(/<meta\b[^>]*>/gi, tag => {
    if (attribute(tag, 'name').toLowerCase() !== 'viewport') return tag;
    for (const directive of attribute(tag, 'content').split(/[,;]/)) {
      const key = directive.trim().split('=')[0].trim().toLowerCase();
      if (key && !lockedKeys.has(key)) extras.set(key, directive.trim());
    }
    return '';
  });
  const content = ['width=device-width', 'initial-scale=1', 'minimum-scale=1', 'maximum-scale=1', 'user-scalable=no', ...extras.values()].join(',');
  if (!/<head\b[^>]*>/i.test(html)) throw new Error('合成页面缺少 head，无法固定视口');
  return html.replace(/<head\b[^>]*>/i, tag => `${tag}\n<meta name="viewport" content="${content}">\n${guard}`);
}
