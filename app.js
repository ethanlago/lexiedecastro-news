document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('news-grid');
    const loader = document.getElementById('loader');

    try {
        // Fetch static JSON file directly
        const response = await fetch('./stories.json?t=' + new Date().getTime());
        const data = await response.json();

        // Remove loader
        if (loader) loader.remove();

        if (data.stories && data.stories.length > 0) {
            data.stories.forEach((story, index) => {
                // Format the date nicely
                const dateObj = new Date(story.pubDate);
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                const card = document.createElement('a');
                card.href = story.link;
                card.target = '_blank';
                card.className = 'story-card';
                // Add staggered animation delay
                card.style.animationDelay = `${index * 0.05}s`;

                let imageHtml = '';
                if (story.image) {
                    imageHtml = `<div class="story-image" style="background-image: url('${story.image}')"></div>`;
                }

                card.innerHTML = `
                    ${imageHtml}
                    <div class="story-content">
                        <div class="story-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formattedDate}
                        </div>
                        <h2 class="story-title">${story.title}</h2>
                        <div class="read-more">
                            Read Story 
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </div>
                    </div>
                `;

                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No stories found</h3>
                    <p>Check back later for new updates from Lexie.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        grid.innerHTML = `
            <div class="empty-state" style="color: #ef4444;">
                <h3>Connection Error</h3>
                <p>Failed to load stories. Please make sure the server is running.</p>
            </div>
        `;
    }
});
