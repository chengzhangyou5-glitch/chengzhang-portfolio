import React from 'react';

const h = React.createElement;
// All four routes share this foreground; their existing backgrounds/readers stay independent.
export function ProjectDetailHero({ project, readingAnchor = '#project-reading' }) {
  const sections = project.sections || [
    { title: '项目背景', text: project.background },
    { title: '项目目标', text: project.objective },
    { title: '核心工作', items: project.contributions },
    { title: '实际成果', text: project.outcome },
  ];
  return h('section', { className: 'project-overview', 'aria-labelledby': 'project-title', id: 'project-archive' },
    h('div', { className: 'project-overview-top' },
      h('div', { className: 'project-overview-identity' },
        h('div', { className: 'project-overview-heading' },
          h('h1', { id: 'project-title', lang: project.titleLanguage }, project.title),
          project.subtitle && h('p', { className: 'project-overview-subtitle' }, project.subtitle)),
        h('div', { className: 'project-overview-profile' },
          h('dl', { className: 'project-overview-meta' },
            h('div', null, h('dt', null, '担任角色'), h('dd', null, project.role)),
            h('div', null, h('dt', null, '项目时间'), h('dd', null, project.period))),
          h('ul', { className: 'project-overview-tags', 'aria-label': '设计方向' }, project.tags.map(tag => h('li', { key: tag }, tag))))),
      h('figure', { className: 'project-overview-cover' },
        h('img', { src: project.cover.src, width: project.cover.width, height: project.cover.height, alt: `${project.title} · ${project.cover.caption || '项目预览'}`, fetchPriority: 'high', decoding: 'async' }))),
    h('div', { className: 'project-overview-notes' }, sections.map(section =>
      h('section', { className: 'project-overview-note', key: section.title },
        h('h2', null, section.title),
        section.items ? h('ul', null, section.items.map((text, index) => h('li', { key: index }, text))) : h('p', null, section.text)))),
    h('a', { className: 'project-overview-cue', href: readingAnchor },
      h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: 'm6 9 6 6 6-6' })),
      '向下浏览完整项目'));
}
