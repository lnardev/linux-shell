import { escapeHtml, escapeAttr, sanitizeInline, applyVars, toScript, readStored, writeStored } from './core.js';

const UNSET = /\{\{([a-z_][a-z0-9_]*)\}\}/gi;

function cmdHtml(cmd) {
  return escapeHtml(cmd).replace(UNSET, '<mark class="unset">{{$1}}</mark>');
}

function flashCopied(btn, text) {
  const original = btn.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ copiado';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1400);
  });
}

function stepHtml(step, i) {
  return `
    <li class="step${step.danger ? ' danger' : ''}" data-i="${i}">
      <label class="step-check"><input type="checkbox" aria-label="Paso ${i + 1} completado"><span class="step-n">${i + 1}</span></label>
      <div class="step-body">
        <h3>${escapeHtml(step.title)}</h3>
        <div class="cmdline"><span class="prompt">$</span><code></code><button class="copybtn" type="button">copiar</button></div>
        <p>${sanitizeInline(step.desc)}</p>
        ${step.warn ? `<div class="warn">⚠ ${sanitizeInline(step.warn)}</div>` : ''}
      </div>
    </li>`;
}

function renderOne(pb) {
  const varsKey = `pb:vars:${pb.id}`;
  const doneKey = `pb:done:${pb.id}`;
  const values = { ...Object.fromEntries((pb.vars ?? []).map((v) => [v.name, v.default ?? ''])), ...readStored(localStorage, varsKey, {}) };
  const done = new Set(readStored(localStorage, doneKey, []));

  const sec = document.createElement('section');
  sec.className = 'pb';
  sec.id = `pb-${pb.id}`;
  sec.innerHTML = `
    <div class="cat-head"><span class="cat-num">▶</span><h2>${escapeHtml(pb.title)}</h2>${pb.time ? `<span class="pb-time">${escapeHtml(pb.time)}</span>` : ''}</div>
    <p class="cat-desc">${sanitizeInline(pb.desc)}</p>
    ${(pb.vars ?? []).length ? `<div class="pb-vars">${pb.vars.map((v) => `
      <label>${escapeHtml(v.label)}<input type="text" data-var="${escapeAttr(v.name)}" value="${escapeAttr(values[v.name])}" placeholder="${escapeAttr(v.name)}" autocomplete="off" spellcheck="false"></label>`).join('')}</div>` : ''}
    <div class="pb-progress"><div class="pb-bar"><span></span></div><span class="pb-count"></span>
      <button class="copybtn pb-script" type="button">copiar como script</button>
      <button class="copybtn pb-reset" type="button">reiniciar</button></div>
    <ol class="steps">${pb.steps.map(stepHtml).join('')}</ol>`;

  const steps = [...sec.querySelectorAll('.step')];
  const paint = () => {
    steps.forEach((li, i) => {
      const cmd = applyVars(pb.steps[i].cmd, values);
      li.querySelector('code').innerHTML = cmdHtml(cmd);
      li.dataset.cmd = cmd;
      li.classList.toggle('done', done.has(i));
      li.querySelector('input').checked = done.has(i);
    });
    sec.querySelector('.pb-bar span').style.width = `${(done.size / steps.length) * 100}%`;
    sec.querySelector('.pb-count').textContent = `${done.size}/${steps.length}`;
  };
  paint();

  sec.addEventListener('input', (e) => {
    const field = e.target.closest('[data-var]');
    if (!field) return;
    values[field.dataset.var] = field.value.trim();
    writeStored(localStorage, varsKey, values);
    paint();
  });
  sec.addEventListener('change', (e) => {
    const li = e.target.closest('.step');
    if (!li || e.target.type !== 'checkbox') return;
    const i = Number(li.dataset.i);
    if (e.target.checked) done.add(i); else done.delete(i);
    writeStored(localStorage, doneKey, [...done]);
    paint();
  });
  sec.addEventListener('click', (e) => {
    const btn = e.target.closest('.copybtn');
    if (!btn) return;
    if (btn.classList.contains('pb-script')) flashCopied(btn, toScript(pb, values));
    else if (btn.classList.contains('pb-reset')) { done.clear(); writeStored(localStorage, doneKey, []); paint(); }
    else flashCopied(btn, btn.closest('.step').dataset.cmd);
  });

  const link = document.createElement('a');
  link.href = `#pb-${pb.id}`;
  link.dataset.target = sec.id;
  link.innerHTML = `<span class="n">▶</span> ${escapeHtml(pb.title)}`;
  return { sec, link };
}

export function renderPlaybooks(playbooks, toc, container) {
  playbooks.forEach((pb) => {
    const { sec, link } = renderOne(pb);
    toc.appendChild(link);
    container.appendChild(sec);
  });
}
