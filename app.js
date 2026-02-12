// Story state management
const storyState = {
    character: {
        name: '',
        type: '',
        appearance: '',
        personality: ''
    },
    choices: [],
    currentScene: 'welcome',
    storyParts: []
};

// Initialize the app
function init() {
    showWelcomeScreen();
}

function showWelcomeScreen() {
    const content = `
        <div class="text-center fade-in">
            <h2 class="text-4xl font-bold text-purple-800 mb-6">Welcome, Young Storyteller! 📖</h2>
            <p class="text-xl text-gray-700 mb-8">
                Let's create an amazing adventure together! First, we need to create your hero.
            </p>
            <button onclick="startCharacterCreation()" 
                    class="bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold py-4 px-8 rounded-full transform transition hover:scale-110">
                Start Creating! 🎨
            </button>
        </div>
    `;
    document.getElementById('storyContent').innerHTML = content;
}

async function startCharacterCreation() {
    storyState.currentScene = 'character-type';
    
    const content = `
        <div class="fade-in">
            <h2 class="text-3xl font-bold text-purple-800 mb-6">Who is your hero?</h2>
            <p class="text-lg text-gray-700 mb-6">Choose what kind of character you want to be:</p>
            <div class="grid grid-cols-2 gap-4">
                <button onclick="selectCharacterType('brave knight')" 
                        class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600">
                    <div class="text-6xl mb-3">🛡️</div>
                    <div class="text-xl font-bold text-purple-800">Brave Knight</div>
                    <div class="text-gray-600 mt-2">Strong and courageous</div>
                </button>
                <button onclick="selectCharacterType('clever wizard')" 
                        class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600">
                    <div class="text-6xl mb-3">🧙</div>
                    <div class="text-xl font-bold text-purple-800">Clever Wizard</div>
                    <div class="text-gray-600 mt-2">Smart and magical</div>
                </button>
                <button onclick="selectCharacterType('friendly dragon')" 
                        class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600">
                    <div class="text-6xl mb-3">🐉</div>
                    <div class="text-xl font-bold text-purple-800">Friendly Dragon</div>
                    <div class="text-gray-600 mt-2">Loyal and powerful</div>
                </button>
                <button onclick="selectCharacterType('curious explorer')" 
                        class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600">
                    <div class="text-6xl mb-3">🔍</div>
                    <div class="text-xl font-bold text-purple-800">Curious Explorer</div>
                    <div class="text-gray-600 mt-2">Adventurous and brave</div>
                </button>
            </div>
        </div>
    `;
    document.getElementById('storyContent').innerHTML = content;
}

async function selectCharacterType(type) {
    storyState.character.type = type;
    storyState.currentScene = 'character-name';
    
    const content = `
        <div class="fade-in">
            <h2 class="text-3xl font-bold text-purple-800 mb-6">Great choice! 🎉</h2>
            <p class="text-lg text-gray-700 mb-4">You're a ${type}!</p>
            <p class="text-lg text-gray-700 mb-6">What's your hero's name?</p>
            <input type="text" id="nameInput" 
                   class="w-full text-2xl p-4 rounded-xl border-4 border-purple-300 focus:border-purple-600 outline-none mb-4"
                   placeholder="Enter a cool name..." 
                   onkeypress="if(event.key==='Enter') submitName()">
            <button onclick="submitName()" 
                    class="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full">
                Continue ➜
            </button>
        </div>
    `;
    document.getElementById('storyContent').innerHTML = content;
    document.getElementById('nameInput').focus();
}

async function submitName() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) {
        alert('Please enter a name for your hero!');
        return;
    }
    storyState.character.name = name;
    await generateCharacterAppearance();
}

async function generateCharacterAppearance() {
    storyState.currentScene = 'appearance-choice';
    showLoading(true);
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `Create two different visual descriptions for a ${storyState.character.type} named ${storyState.character.name} in a children's story. Make them distinct and appealing to kids ages 5-10. Return as JSON: {"option1": "description", "option2": "description"}`
                }]
            })
        });

        const data = await response.json();
        const textContent = data.content.find(c => c.type === 'text')?.text || '';
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        const descriptions = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            option1: `A ${storyState.character.type} with bright, cheerful colors and a friendly smile`,
            option2: `A ${storyState.character.type} with mysterious, magical features and wise eyes`
        };

        showLoading(false);
        
        const content = `
            <div class="fade-in">
                <h2 class="text-3xl font-bold text-purple-800 mb-4">What does ${storyState.character.name} look like?</h2>
                <p class="text-lg text-gray-700 mb-6">Choose the style you like best:</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onclick="selectAppearance(\`${descriptions.option1}\`)" 
                            class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600 text-left">
                        <div class="text-4xl mb-3">🎨</div>
                        <div class="font-bold text-purple-800 mb-2">Option 1</div>
                        <div class="text-gray-700">${descriptions.option1}</div>
                    </button>
                    <button onclick="selectAppearance(\`${descriptions.option2}\`)" 
                            class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600 text-left">
                        <div class="text-4xl mb-3">✨</div>
                        <div class="font-bold text-purple-800 mb-2">Option 2</div>
                        <div class="text-gray-700">${descriptions.option2}</div>
                    </button>
                </div>
                <div class="mt-6 text-center">
                    <button onclick="customAppearance()" 
                            class="text-purple-600 hover:text-purple-800 font-bold underline">
                        Or describe your own idea!
                    </button>
                </div>
            </div>
        `;
        document.getElementById('storyContent').innerHTML = content;
        
    } catch (error) {
        showLoading(false);
        console.error('Error generating appearance:', error);
        customAppearance();
    }
}

function customAppearance() {
    const content = `
        <div class="fade-in">
            <h2 class="text-3xl font-bold text-purple-800 mb-6">Describe ${storyState.character.name}!</h2>
            <p class="text-lg text-gray-700 mb-4">Tell me what they look like:</p>
            <textarea id="appearanceInput" 
                      class="w-full text-lg p-4 rounded-xl border-4 border-purple-300 focus:border-purple-600 outline-none mb-4 h-32"
                      placeholder="E.g., Has sparkly blue scales, wears a golden crown, has kind green eyes..."></textarea>
            <button onclick="submitCustomAppearance()" 
                    class="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full">
                That's Perfect! ➜
            </button>
        </div>
    `;
    document.getElementById('storyContent').innerHTML = content;
    document.getElementById('appearanceInput').focus();
}

function submitCustomAppearance() {
    const appearance = document.getElementById('appearanceInput').value.trim();
    if (!appearance) {
        alert('Please describe your character!');
        return;
    }
    selectAppearance(appearance);
}

async function selectAppearance(appearance) {
    storyState.character.appearance = appearance;
    await choosePersonality();
}

async function choosePersonality() {
    storyState.currentScene = 'personality';
    
    const content = `
        <div class="fade-in">
            <h2 class="text-3xl font-bold text-purple-800 mb-6">What's ${storyState.character.name} like?</h2>
            <p class="text-lg text-gray-700 mb-6">Choose their personality:</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="selectPersonality('brave and bold')" 
                        class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600">
                    <div class="text-5xl mb-2">💪</div>
                    <div class="font-bold text-purple-800">Brave & Bold</div>
                </button>
                <button onclick="selectPersonality('kind and caring')" 
                        class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600">
                    <div class="text-5xl mb-2">💝</div>
                    <div class="font-bold text-purple-800">Kind & Caring</div>
                </button>
                <button onclick="selectPersonality('funny and playful')" 
                        class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600">
                    <div class="text-5xl mb-2">😄</div>
                    <div class="font-bold text-purple-800">Funny & Playful</div>
                </button>
            </div>
        </div>
    `;
    document.getElementById('storyContent').innerHTML = content;
}

async function selectPersonality(personality) {
    storyState.character.personality = personality;
    await startAdventure();
}

async function startAdventure() {
    storyState.currentScene = 'story-beginning';
    showLoading(true);
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `Create an exciting story opening for a children's adventure story. Character: ${storyState.character.name}, a ${storyState.character.type} who is ${storyState.character.personality}. Appearance: ${storyState.character.appearance}. 

Write 3-4 engaging paragraphs that set up an exciting problem or quest. End with a moment where the character must make a choice. Keep it appropriate for ages 5-10, magical, and exciting!`
                }]
            })
        });

        const data = await response.json();
        const storyText = data.content.find(c => c.type === 'text')?.text || 'An adventure begins...';
        
        storyState.storyParts.push(storyText);
        showLoading(false);
        
        const content = `
            <div class="fade-in">
                <div class="bg-white bg-opacity-50 rounded-xl p-6 mb-6">
                    <div class="text-sm text-purple-600 font-bold mb-2">Your Character:</div>
                    <div class="text-lg font-bold text-purple-800">${storyState.character.name}</div>
                    <div class="text-gray-700">${storyState.character.type} • ${storyState.character.personality}</div>
                </div>
                
                <div class="prose prose-lg mb-8">
                    <div class="text-gray-800 leading-relaxed whitespace-pre-line">${storyText}</div>
                </div>
                
                <button onclick="generateChoices()" 
                        class="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full">
                    What happens next? 🤔
                </button>
            </div>
        `;
        document.getElementById('storyContent').innerHTML = content;
        
    } catch (error) {
        showLoading(false);
        console.error('Error generating story:', error);
        
        const fallbackStory = `Once upon a time, ${storyState.character.name} the ${storyState.character.type} lived in a magical kingdom. One sunny morning, ${storyState.character.name} discovered a mysterious map hidden in an old tree. The map showed a path to a legendary treasure, but also warned of challenges ahead. ${storyState.character.name} felt excited and a little nervous. Should they go on this adventure alone, or find friends to join them?`;
        
        storyState.storyParts.push(fallbackStory);
        
        const content = `
            <div class="fade-in">
                <div class="prose prose-lg mb-8">
                    <div class="text-gray-800 leading-relaxed">${fallbackStory}</div>
                </div>
                <button onclick="generateChoices()" 
                        class="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full">
                    What happens next? 🤔
                </button>
            </div>
        `;
        document.getElementById('storyContent').innerHTML = content;
    }
}

async function generateChoices() {
    showLoading(true);
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `Based on this story so far: "${storyState.storyParts.join(' ')}"

Generate 3 exciting choices for what ${storyState.character.name} could do next. Each choice should lead to a different type of adventure. Return as JSON: {"choices": [{"action": "short description", "emoji": "relevant emoji"}, ...]}`
                }]
            })
        });

        const data = await response.json();
        const textContent = data.content.find(c => c.type === 'text')?.text || '';
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        const choicesData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            choices: [
                {action: "Go on the adventure alone, trusting your own abilities", emoji: "🦸"},
                {action: "Find friends in the village to join you", emoji: "👥"},
                {action: "Study the map more carefully first", emoji: "🔍"}
            ]
        };

        showLoading(false);
        
        let choicesHtml = choicesData.choices.map((choice, index) => `
            <button onclick='makeChoice(${index}, \`${choice.action}\`, "${choice.emoji}")' 
                    class="choice-card bg-white p-6 rounded-xl border-4 border-purple-300 hover:border-purple-600 text-left w-full mb-4">
                <div class="flex items-center">
                    <div class="text-4xl mr-4">${choice.emoji}</div>
                    <div class="text-lg text-gray-800">${choice.action}</div>
                </div>
            </button>
        `).join('');
        
        const currentStory = document.getElementById('storyContent').innerHTML;
        const content = `
            <div class="fade-in">
                ${currentStory}
                <div class="mt-8">
                    <h3 class="text-2xl font-bold text-purple-800 mb-4">What should ${storyState.character.name} do?</h3>
                    ${choicesHtml}
                </div>
            </div>
        `;
        document.getElementById('storyContent').innerHTML = content;
        
    } catch (error) {
        showLoading(false);
        console.error('Error generating choices:', error);
    }
}

async function makeChoice(index, choice, emoji) {
    storyState.choices.push({choice, emoji, sceneNumber: storyState.storyParts.length});
    showLoading(true);
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `Continue this story. Previous: "${storyState.storyParts.join(' ')}"

${storyState.character.name} decided to: ${choice}

Write 2-3 paragraphs showing what happens next. Make it exciting and age-appropriate (ages 5-10). ${storyState.storyParts.length >= 3 ? 'This should be building toward a satisfying conclusion.' : 'Include another decision point.'}`
                }]
            })
        });

        const data = await response.json();
        const nextPart = data.content.find(c => c.type === 'text')?.text || 'The adventure continues...';
        
        storyState.storyParts.push(nextPart);
        showLoading(false);
        
        const shouldEnd = storyState.storyParts.length >= 4;
        
        const content = `
            <div class="fade-in">
                <div class="bg-purple-100 rounded-xl p-4 mb-6">
                    <div class="text-sm text-purple-600 font-bold">You chose: ${emoji} ${choice}</div>
                </div>
                
                <div class="prose prose-lg mb-8">
                    <div class="text-gray-800 leading-relaxed whitespace-pre-line">${nextPart}</div>
                </div>
                
                ${shouldEnd ? `
                    <button onclick="endStory()" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-8 rounded-full mb-4">
                        Finish the Story! 📖
                    </button>
                ` : `
                    <button onclick="generateChoices()" 
                            class="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full">
                        Continue the Adventure! ➜
                    </button>
                `}
            </div>
        `;
        document.getElementById('storyContent').innerHTML = content;
        
    } catch (error) {
        showLoading(false);
        console.error('Error continuing story:', error);
    }
}

async function endStory() {
    showLoading(true);
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `Write a satisfying, uplifting ending to this story: "${storyState.storyParts.join(' ')}"

Make it heartwarming and celebrate ${storyState.character.name}'s journey. Keep it age-appropriate (ages 5-10) and end with a positive message. 2-3 paragraphs.`
                }]
            })
        });

        const data = await response.json();
        const ending = data.content.find(c => c.type === 'text')?.text || 'And they lived happily ever after!';
        
        storyState.storyParts.push(ending);
        showLoading(false);
        
        showFinalStory();
        
    } catch (error) {
        showLoading(false);
        console.error('Error ending story:', error);
        storyState.storyParts.push('And so, after all their adventures, ' + storyState.character.name + ' returned home as a true hero, ready for the next adventure!');
        showFinalStory();
    }
}

function showFinalStory() {
    const fullStory = storyState.storyParts.join('\n\n');
    
    const content = `
        <div class="fade-in text-center">
            <h2 class="text-4xl font-bold text-purple-800 mb-6">🎉 Your Story is Complete! 🎉</h2>
            
            <div class="bg-white rounded-xl p-8 mb-6 text-left">
                <h3 class="text-3xl font-bold text-purple-800 mb-4 text-center">
                    The Adventures of ${storyState.character.name}
                </h3>
                <div class="prose prose-lg max-w-none">
                    <div class="text-gray-800 leading-relaxed whitespace-pre-line">${fullStory}</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button onclick="downloadStory()" 
                        class="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-8 rounded-full">
                    📥 Download Story
                </button>
                <button onclick="init()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full">
                    ✨ Create New Story
                </button>
            </div>
            
            <div class="text-sm text-gray-600 bg-white bg-opacity-50 rounded-xl p-4">
                <p>💡 Tip: In a full version, this would generate a beautifully formatted PDF book you could print or order!</p>
            </div>
        </div>
    `;
    document.getElementById('storyContent').innerHTML = content;
}

function downloadStory() {
    const fullStory = `THE ADVENTURES OF ${storyState.character.name.toUpperCase()}\n\n` +
                     `A ${storyState.character.type} who is ${storyState.character.personality}\n\n` +
                     `---\n\n` +
                     storyState.storyParts.join('\n\n');
    
    const blob = new Blob([fullStory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storyState.character.name}-adventure.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showLoading(show) {
    document.getElementById('loadingIndicator').classList.toggle('hidden', !show);
    document.getElementById('storyContainer').classList.toggle('hidden', show);
}

window.onload = init;
