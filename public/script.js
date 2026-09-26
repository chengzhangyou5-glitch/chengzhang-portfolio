const app = document.getElementById('app');
const path = window.location.pathname.replace(/\/+$/, '') || '/';

const pages = {
  '/': {
    title: 'Portfolio Coming Soon',
    heading: 'Portfolio Coming Soon',
    link: { href: '/portfolio', label: 'Portfolio PDF' },
  },
  '/portfolio': {
    title: 'Portfolio PDF Coming Soon',
    heading: 'Portfolio PDF Coming Soon',
    link: { href: '/', label: 'Home' },
  },
};

const page = pages[path] || {
  title: 'Page Not Found',
  heading: 'Page Not Found',
  link: { href: '/', label: 'Home' },
};

document.title = page.title;

const section = document.createElement('section');
section.className = 'placeholder';
const heading = document.createElement('h1');
heading.textContent = page.heading;
const link = document.createElement('a');
link.href = page.link.href;
link.textContent = page.link.label;
section.append(heading, link);
app.append(section);
