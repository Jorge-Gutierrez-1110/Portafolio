async function fetchProjects() {
    const response = await fetch('https://api.airtable.com/v0/YOUR_BASE_ID/YOUR_TABLE_NAME', {
        headers: {
            Authorization: 'Bearer YOUR_PERSONAL_ACCESS_TOKEN'
        }
    });
    const data = await response.json();
    const projects = document.getElementById('projects');
    
    data.records.forEach(record => {
        const project = document.createElement('div');
        project.className = 'project';
        
        const title = document.createElement('h2');
        title.textContent = record.fields.Título;
        
        const description = document.createElement('p');
        description.textContent = record.fields.Descripción;
        
        const image = document.createElement('img');
        image.src = record.fields.Imagen[0].url;
        
        project.appendChild(title);
        project.appendChild(description);
        project.appendChild(image);
        projects.appendChild(project);
    });
}

fetchProjects();