**CSCI-310 Development Notebook**

---

**Guideline:**

- Please document all your development activities, whether you use any AI coding tool or not. You might mix your manual coding or AI tool usage. Just document the entire process.

- If this is a team project or assignment, list all team members’ names in the “Name” field. For each iteration, record the name of the person who contributed any part of the work in the “What do you do?” field.

- Any interactions with AI coding tools such as ChatGPT, Gemini, Copilot, and others must capture the full conversation history.

- Use the format below to record your development activities in a clear and consistent manner.

- Adding more iteration sections if needed.

---

#### **Name:**

Jonathan Gonzalez

Jesutofunmi Oyeleke


#### **Project/Assignment:**

Project 2: 3D Game

##### **Problem/Task:**

This project challenges you to design and develop a 3D interactive game experience using modern web technologies. The goal is to build a functional, engaging, and visually appealing game while adhering to core principles of game development and good coding practices. You have the flexibility to choose your game's theme and mechanics, such as a shooter, puzzle, exploration, or simulation game, but must meet the fundamental requirements .

##### **Development Log**

**Iteration 1:**

-  **Goal/Task/Rationale:** Set up Project Structure.

-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Linking current project folder to GitHub repository. Create vite project using npm.

**Iteration 2:**

-  **Goal/Task/Rationale:** Add Players, Platforms, Movement, Death Zone and Collisions.

-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Using THREE.js, I created a rectangle which the user could control using awsd. The platforms were also rectangles with different sizes. I also added coallision detection between the player and the platforms. If the player falls outside of "ground", the program resets the user's position to the start of the game. Finally, I implemented movement mechanics such as moving side to side, also jumping and rapid fall.

**Iteration 3:**

-  **Goal/Task/Rationale:** Create Entities for Games

-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: After realizing that creating a new platform is really tedious, I decided to move into a factory model. This model has the ability to create multiple objects from the same type. With this logic, I created a class for each of the entities/objects in the game. In this case, the objects are: Platforms, Walls, Player, Spikes. Even though all of them share similar behavior, the differ in some details. In the main file, the program starts by building the world (creating and placing the entities into the main scene). After this, the program constantly keeps track of the user's position and checks for collisions to any of the objects.

**Iteration 4:**

-  **Goal/Task/Rationale:** Add Double Jump

-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Using the same logic as jump, the player is able to jump a second time, however, the second jump has 85% power from the initial jump. The main feature is the program is able to identify when the user stops pressing w. Thus, when the user is not on ground, the player is able to jump a second time reaching a higher height. 

**Iteration 5:**

-  **Goal/Task/Rationale:** Add Levels (1-20) and Add Difficulty Levels(Easy, Medium, Hard) to Game

-  **What do you do?** 
    - **Name**: Jesutofunmi Oyeleke
    - **Action**: I started by creating the folder and data structure for the level data. I then prompted an AI assistant to generate values and suggest colors for the platforms of the initial set of 10 levels. For the difficulty implementation, I adjusted the player's jump strength, making it weaker for "Medium" and "Hard" modes to make the platforming more challenging.
    - **Response/Result**: The AI generated different colors and numerous coordinates for my platforms at each level. The AI-generated content served as a good foundation. 
    - **Your Evaluation**: Using the AI was a significant time-saver for creating the initial level layouts. It was very effective for boilerplate generation. However, I had to step in when I didn't like some of the colors generated and manually adjusted many of the platform placements color. 

**Iteration 6:**

-  **Goal/Task/Rationale:** Add deployment to GitHub Pages using GitHub Workflows

-  **What do you do?** 
    - **Name**: Jesutofunmi Oyeleke
    - **Action**: As I was not very familiar with GitHub Actions, I prompted an AI to "generate a GitHub action for GitHub pages." The workflow it produced failed on the first run. I had to debug the workflow file and discovered the issue was with incorrect file paths; the AI did not know my project's specific file structure and used generic paths. I manually corrected the paths to match my project's build output.
    - **Response/Result**: The AI provided a standard but non-functional template for a Vite deployment. While the core jobs and steps were correct, the file paths were wrong. 
    - **Your Evaluation**: The AI was very helpful for generating the boilerplate structure of the workflow, which I was unfamiliar with. However, this experience highlighted that AI tools lack project-specific context. It was a good reminder that AI-generated configuration files almost always require manual review and customization to fit the specific needs of the project.

**Iteration 7:**

-  **Goal/Task/Rationale:** Add 3D features to base game - Camera, Lighting and 3D Entities

-  **What do you do?** 
    - **Name**: Jesutofunmi Oyeleke
    - **Action**: I integrated Three.js to transform the game's visuals in a more 3D feel. I implemented a PerspectiveCamera that smoothly follows the player's movement and always keeps them in focus. The player and platform entities were converted into 3D objects. I attempted to use an AI assistant for generating Three.js code, but I found its suggestions to be largely unhelpful. A large chunk of the work was manual, including refactoring the AI's code, correctly positioning the player at the start, and removing a significant amount of unnecessary code.
    - **Response/Result**: The AI's suggestions for Three.js were not practical. It generated code that was either inefficient or didn't integrate well with my existing structure. The AI contribution was minimal, and I spent most of my time manually writing and debugging the 3D implementation.
    - **Your Evaluation**: The AI was very helpful for generating the boilerplate structure of the workflow, which I was unfamiliar with. However, this experience highlighted that AI tools lack project-specific context. It seems like the models are not fine tined for Three.js

**Iteration 8:**

-  **Goal/Task/Rationale:** Add story, start and end states
-  **What do you do?** 
    - **Name**: Jesutofunmi Oyeleke
    - **Action**: I implemented the start and end game states using HTML/CSS overlays. The start screen introduces the game and allows the player to select a difficulty before beginning. The end screen appears when the player successfully completes the final level, congratulating them on their victory.

**Iteration 9:**

-  **Goal/Task/Rationale:** Break down main.js into multiple files to reduce complexity
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Prompted AI to break down the monolithic main.js file into separate modules. Created managers for Scene, UI, Level, Input, Collision, and Multiplayer. Also separated game state and constants into their own files.
    - **Response/Result**: AI successfully created a modular architecture with clear separation of concerns. Each manager handles a specific aspect of the game.
    - **Your Evaluation**: AI was accurate with the code structure. No clarification needed.

**Iteration 10:**

-  **Goal/Task/Rationale:** Add character model selection with 3D preview
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Asked AI to add a model selection menu with previews for multiple 3D character models (.glb and .gltf formats). Created ModelPreviewManager with a separate Three.js scene for the preview canvas.
    - **Response/Result**: AI created a working model preview system with next/previous navigation and localStorage persistence for the selected model.
    - **Your Evaluation**: AI was accurate. Had to specify rotation adjustments for specific models like the llama.

**Iteration 11:**

-  **Goal/Task/Rationale:** Add player knockout/attack system for multiplayer
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Prompted AI to add attack mechanics using J key or mouse click with directional aiming (WASD/arrows). Attack creates a hitbox in the aimed direction and applies knockback to hit players.
    - **Response/Result**: AI implemented attack with cooldown, directional hitbox, model rotation during attack, and server-side knockback validation.
    - **Your Evaluation**: AI was accurate. Had to specify the exact hitbox dimensions and that model should rotate 90 degrees, not 180.

**Iteration 12:**

-  **Goal/Task/Rationale:** Add gradient background with animated color blobs and particle systems
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Asked AI to add a gradient background with transparent color blobs, waterfall particles falling from the top, and star particles twinkling in the background.
    - **Response/Result**: AI created custom shaders for the animated gradient background and two particle systems using BufferGeometry for performance.
    - **Your Evaluation**: AI was accurate. Had to request larger particle sizes and wider waterfall spread multiple times.

**Iteration 13:**

-  **Goal/Task/Rationale:** Add background music system with volume control
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Prompted AI to create a music manager that shuffles tracks, plays all tracks before reshuffling, and persists volume to localStorage. Added a volume slider in the menu.
    - **Response/Result**: AI created MusicManager class with shuffle queue, auto-advance, error recovery, and browser autoplay handling.
    - **Your Evaluation**: AI was accurate with the implementation. No issues encountered.

**Iteration 14:**

-  **Goal/Task/Rationale:** Add glide and double jump particle effects
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Asked AI to add particle trails when player glides on walls and a burst of particles when double jumping. Requested object pooling for performance.
    - **Response/Result**: AI created ParticleEffectsManager with cyan glide particles and orange jump burst particles, using object pooling and shared geometry.
    - **Your Evaluation**: AI was accurate. No clarification needed.

**Iteration 15:**

-  **Goal/Task/Rationale:** Add procedural textures to platforms assigned by level
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Prompted AI to add subtle procedural textures to platforms (noise, grid, dots, lines patterns) assigned by level number instead of randomly. Ground platform uses minimal texture.
    - **Response/Result**: AI created platformTextures.js with canvas-based texture generation, level-pattern mapping, and texture caching.
    - **Your Evaluation**: AI was accurate. Had to request more visible textures multiple times.

**Iteration 16:**

-  **Goal/Task/Rationale:** Change attack indicator from red block to red particles
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Asked AI to replace the red box attack indicator with animated red particles that spread in the attack direction.
    - **Response/Result**: AI created 18 particle spheres with pulsing scale, flickering opacity, and directional spread animation.
    - **Your Evaluation**: AI was accurate. Had to specify larger particle areas and update server hitbox to match.

**Iteration 17:**

-  **Goal/Task/Rationale:** Add comprehensive JSDoc documentation to all client files
-  **What do you do?** 
    - **Name**: Jonathan Gonzalez
    - **Action**: Prompted AI to add detailed documentation to all client files including module headers, function JSDoc, parameter types, and return types.
    - **Response/Result**: AI documented 20+ files with consistent JSDoc format including @module, @param, @returns, and @type annotations.
    - **Your Evaluation**: AI was accurate and thorough with documentation standards.



