(() => {
    console.log("Bloyid Icons Library Loaded");
  
    class BIcon extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            const iconName = this.getAttribute('name');
            const iconColor = this.getAttribute('color') || 'currentColor'; // Default color
            const iconSize = this.getAttribute('size') || '50px'; // Default size
    
            const iconSVG = this.getSVG(iconName);
            
            if (iconSVG) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = iconSVG;
                wrapper.style.width = iconSize;
                wrapper.style.height = iconSize;
    
                // Set the color on the entire SVG
                const svgElement = wrapper.querySelector('svg');
                svgElement.style.fill = iconColor;
                svgElement.style.width = '100%'; // Ensure it scales correctly
                svgElement.style.height = '100%'; // Ensure it scales correctly
                
                shadow.appendChild(wrapper);
            }
        }
    
        getSVG(iconName) {
            // Example SVGs (you can add more here)
            const icons = {
                icon1: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 412.192 366.961">
                            <rect rx="49.5" ry="49.5" x="7.676" y="203.067" width="99" height="158" class="fills" fill="none" stroke="black" stroke-width="2"/>
                            <rect rx="49.5" ry="49.5" x="302.406" y="202.603" width="99" height="158" class="fills" fill="none" stroke="black" stroke-width="2"/>
                            <path d="M59.157 225.245C57.272 152.37 72.519 102.997 96.59 71.002c27.28-36.262 65.893-50.204 103.743-50.742 37.329-.53 74.115 12.754 101.995 43.959 28.766 32.196 48.051 83.469 48.672 158.329" fill="none" stroke="black" stroke-width="2"/>
                        </svg>`,
                icon2: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 550">
                            <rect rx="81" ry="81" x="62.792" width="162" height="350" class="fills" fill="none" stroke="black" stroke-width="2"/>
                            <path d="M45.792 352.862c37.617 32.872 71.918 43.605 102 41.981 55.486-2.997 94-44.843 94-44.843" fill="none" stroke="black" stroke-width="2"/>
                            <rect rx="0" ry="0" x="109.792" y="382" width="69" height="86" class="fills" fill="black"/>
                            <rect rx="15" ry="15" x="66.792" y="459" width="155" height="50" class="fills" fill="black"/>
                        </svg>`
            };
            
            return icons[iconName] || null;
        }
    }
  
    // Function to replace <blicon> elements with corresponding SVGs and apply styles
    function loadIcons() {
      document.querySelectorAll('blicon').forEach((el) => {
        const iconName = el.getAttribute('name');
        if (iconLibrary[iconName]) {
          const iconSVG = document.createElement("div");
          iconSVG.innerHTML = iconLibrary[iconName];
          
          // Extract the SVG element
          const svgElement = iconSVG.querySelector("svg");
  
          // Apply optional attributes for style and animation
          const color = el.getAttribute("color") || "currentColor";
          const size = el.getAttribute("size") || "50px";
          const animationClass = el.getAttribute("animation") || "";
          const customClass = el.getAttribute("class") || "";  // Get custom class
  
          // Apply styles to SVG
          svgElement.style.width = size;
          svgElement.style.height = size;
          svgElement.style.fill = color;
  
          // Apply animation class if provided
          if (animationClass) {
            svgElement.classList.add(animationClass);
          }
  
          // Add custom class to the SVG
          if (customClass) {
            svgElement.classList.add(...customClass.split(' '));  // Add multiple classes if needed
          }
  
          // Inject styled SVG back into <blicon>
          el.innerHTML = "";
          el.appendChild(svgElement);
        } else {
          console.warn(`Icon "${iconName}" not found in the library.`);
          el.innerHTML = `<span style="color: red;">Icon not found: ${iconName}</span>`;
        }
      });
    }
  
    // Load icons on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', loadIcons);
  
    // Reload icons if new elements are added dynamically
    new MutationObserver(loadIcons).observe(document.body, { childList: true, subtree: true });
  })();
  