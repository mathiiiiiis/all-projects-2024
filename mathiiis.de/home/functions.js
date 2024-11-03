// Project
const projects = [
    { title: 'Project 4', category: 'web', image: '/api/placeholder/60/60', url: 'project4.html' },
    { title: 'Project 5', category: 'mobile', image: '/api/placeholder/60/60', url: 'project5.html' },
    { title: 'Project 6', category: 'design', image: '/api/placeholder/60/60', url: 'project6.html' },
    { title: 'Project 7', category: 'web', image: '/api/placeholder/60/60', url: 'project7.html' },
];

// project grid
const projectGrid = document.querySelector('.project-grid');
projects.forEach(project => {
    const projectElement = document.createElement('div');
    projectElement.className = 'small-project';
    projectElement.dataset.category = project.category;
    projectElement.innerHTML = `
        <img src="${project.image}" alt="${project.title}">
        <h3>${project.title}</h3>
    `;
    projectGrid.appendChild(projectElement);
});

// Categories
const categoryButtons = document.querySelectorAll('.category-btn');
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.dataset.category;
        
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const allProjects = document.querySelectorAll('[data-category]');
        allProjects.forEach(project => {
            if (category === 'all' || project.dataset.category === category) {
                project.style.display = '';
            } else {
                project.style.display = 'none';
            }
        });
    });
});

// Project interactions
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    let lastTap = 0;
    card.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            openIframe(card.dataset.url);
        }
        lastTap = currentTime;
    });
});

// shortcut functionality
document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 'l') {
        const activeCard = document.querySelector('.project-card:hover');
        if (activeCard) {
            openIframe(activeCard.dataset.url);
        }
    }
});

function openIframe(url) {
    const iframeContainer = document.querySelector('.project-iframe');
    const iframe = iframeContainer.querySelector('iframe');
    iframe.src = url || 'about:blank';
    iframeContainer.style.display = 'block';
}

document.querySelector('.close-iframe').addEventListener('click', () => {
    const iframeContainer = document.querySelector('.project-iframe');
    iframeContainer.style.display = 'none';
    iframeContainer.querySelector('iframe').src = 'about:blank';
});