// Initialize canvas context
const canvas = document.getElementById('climberCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1800;
canvas.height = 600;

// Function to calculate average scores and min/max lines
function processScores(data) {
    const parsedData = data//JSON.parse(data);
    return parsedData.subjects.map(subject => {
        const totalWeightedScore = subject.activities.reduce((acc, activity) => acc + (activity.score * activity.weight), 0);
        const totalWeight = subject.activities.reduce((acc, activity) => acc + activity.weight, 0);
        const averageScore = totalWeightedScore / totalWeight;
        return {
            subject: subject.subject,
            averageScore: averageScore,
            minAverageScore: subject.minAverageScore,
            maxAverageScore: subject.maxAverageScore,
            activities: subject.activities
        };
    });
}

// Process the JSON data
// const scoresData = processScores(jsonData);

let scoresData = [];

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    scoresData = processScores(data);
    scoresData.forEach((scoreData, index) => {
        drawStaticElements(scoreData, index);
        animateClimber(scoreData, index);
    });
  });


// Draw the static elements (min and max average score lines) for each subject and display the scores
function drawStaticElements(scoreData, subjectIndex) {
    const startX = 150 * (subjectIndex + 1); // Adjust based on your layout
    const lineLength = 100; // The max length of the line

    // Draw Max Average Line
    const maxY = canvas.height - (scoreData.maxAverageScore / 100 * canvas.height);
    ctx.beginPath();
    ctx.moveTo(startX - (lineLength / 2), maxY);
    ctx.lineTo(startX + (lineLength / 2), maxY);
    ctx.strokeStyle = 'red';
    ctx.stroke();

    // Display the Max Average Score near the line
    ctx.fillText(`${scoreData.maxAverageScore}`, startX + 55, maxY + 10);

    // Display the Subject Name at the top of the Max Average Score line
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center'; // Ensure text is centered on the line
    const subjectTextWidth = ctx.measureText(scoreData.subject).width;

    if (subjectTextWidth > 100) { // Assuming 100 is the max line width
        // Logic to wrap text without using split()
        wrapText(ctx, scoreData.subject, startX, 10, 100, 14); // Example y-position: 10, max line width: 100, line height: 14
    } else {
        ctx.fillText(scoreData.subject, startX, 10); // Example y-position: 10
    }

    // Draw Min Average Line (same as before, unchanged)
    const minY = canvas.height - (scoreData.minAverageScore / 100 * canvas.height);
    ctx.beginPath();
    ctx.moveTo(startX - (lineLength / 2), minY);
    ctx.lineTo(startX + (lineLength / 2), minY);
    ctx.strokeStyle = 'green';
    ctx.stroke();

    // Draw starting Line (same as before, unchanged)
    const zeroY = canvas.height - 1;
    ctx.beginPath();
    ctx.moveTo(startX - (lineLength / 2), zeroY);
    ctx.lineTo(startX + (lineLength / 2), zeroY);
    ctx.strokeStyle = 'green';
    ctx.stroke();

    // Display the Max Average Score near the line
    ctx.fillText(`KKM: ${scoreData.minAverageScore}`, startX + 55, minY);

    // Display the Zero Score near the line
    ctx.fillText(`0`, startX + 55, zeroY);
}

// Function to wrap text on canvas without using split()
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.match(/\S+/g) || [];
    let line = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

// Function to redraw static elements, including subject names at the top of the maxAverageScore line
function redrawStaticElements(scoresData) {
    scoresData.forEach((scoreData, index) => {
        drawStaticElements(scoreData, index);
        // Additional logic to draw subject names and handle long text
        const startX = 150 * (index + 1);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        // Use canvas' measureText to determine if the text needs to be wrapped
        const textWidth = ctx.measureText(scoreData.subject).width;
        if (textWidth > 100) { // Assuming 100 is the max line width
            // Logic to wrap text without using split()
            wrapText(ctx, scoreData.subject, startX, 10, 100, 14); // Example y-position: 10, max line width: 100, line height: 14
        } else {
            ctx.fillText(scoreData.subject, startX, 10); // Example y-position: 10
        }
    });
}

// Additional global variables to track climbers and their information
const climbers = [];

// Function to draw a climber and store its position and related data for interactivity
function drawClimber(x, y, radius, color, scoreData) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = color;
    ctx.fill();

    // Store climber information for click detection
    climbers.push({ x, y, radius, scoreData });
}

// Function to display climber information
function displayClimberInfo(scoreData) {
    const infoContainer = document.getElementById('infoContainer');
    infoContainer.innerHTML = `<p>Subject: ${scoreData.subject}<br>Average Score: ${scoreData.averageScore.toFixed(2)}</p>`;
}

// Function to display activities for a clicked subject
function displayActivitiesForSubject(scoreData, subjectIndex, x, y) {
    const startX = 150 * (subjectIndex + 1);

    // Check if the click is within the climber's x-axis range
    if (x >= startX - 25 && x <= startX + 25) {
        // Clear a part of the canvas where activities are displayed
        // Adjust the clearRect parameters as needed based on your layout
        ctx.clearRect(0, canvas.height - 100, canvas.width, 100);

        // Display each activity
        scoreData.activities.forEach(activity => {
            const activityY = canvas.height - (activity.score / 100 * canvas.height);

            // Draw a line for the activity score
            ctx.beginPath();
            ctx.moveTo(startX - 10, activityY);
            ctx.lineTo(startX + 10, activityY);
            ctx.strokeStyle = 'blue';
            ctx.stroke();

            // Display the activity name and score
            ctx.fillStyle = '#000';
            ctx.fillText(`${activity.type}: ${activity.score}%`, startX + 15, activityY);
        });
    }
}

// Function to check if a point is inside a circle
function isInsideCircle(point, circle) {
    return Math.sqrt((point.x - circle.x) ** 2 + (point.y - circle.y) ** 2) < circle.radius;
}

// Event listener for canvas clicks
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const clickPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    // Check each climber to see if the click was inside its bounds
    climbers.forEach(climber => {
        if (isInsideCircle(clickPos, climber)) {
            displayClimberInfo(climber.scoreData);
        }
    });
});


// Animate the climber
function animateClimber(scoreData, subjectIndex) {
    const targetY = canvas.height - (scoreData.averageScore / 100 * canvas.height);
    const startX = 150 * (subjectIndex + 1); // Starting X based on the subject index to spread out the climbers
    let currentY = canvas.height; // Start from the bottom of the canvas

    function step() {
        // Clear the previous position of the climber to create the animation effect
        // ctx.clearRect(startX - 25, currentY - 25, 50, 50); // Clear a small area around the climber

        drawClimber(startX, currentY, 20, 'blue', scoreData);

        // Move the climber up
        currentY -= 2; // Adjust the speed of the climbing here

        // Stop the animation when the climber reaches the target position
        if (currentY <= targetY) {
            currentY = targetY;
        }

        // Draw the climber at the new position
        ctx.beginPath();
        ctx.arc(startX, currentY, 20, 0, Math.PI * 2, false);
        ctx.fillStyle = 'blue';
        ctx.fill();

        // Continue the animation if not reached the target position yet
        if (currentY > targetY) {
            requestAnimationFrame(step);
        }
    }

    step();
}

// Function to calculate the recommended score for the next activity
function calculateRecommendedScore(currentAverage, minAverageScore, currentWeight, newActivityWeight) {
    if (currentAverage >= minAverageScore) {
        // If the current average is already above minAverageScore, recommend a score to sustain the current average
        return currentAverage; // Sustaining the current average requires a score equal to the current average
    } else {
        // If the current average is below minAverageScore, calculate the score needed to reach minAverageScore
        const totalScoreNeeded = minAverageScore * (currentWeight + newActivityWeight);
        const currentScore = currentAverage * currentWeight;
        return (totalScoreNeeded - currentScore) / newActivityWeight;
    }
}

// Event listener for canvas clicks to display the popup with activities for the clicked subject
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    climbers.forEach(climber => {
        if (isInsideCircle({x, y}, climber)) {
            const popupWindow = document.getElementById('popupWindow');
            const popupTitle = document.getElementById('popupTitle');
            const activitiesList = document.getElementById('activitiesList');
            const averageScore = document.getElementById('averageScore');
            const minAvgScoreEl = document.getElementById('minAvgScore');
            const maxAvgScoreEl = document.getElementById('maxAvgScore');
            const recommendedScoreEl = document.getElementById('recommendedScore');

            popupTitle.textContent = climber.scoreData.subject;
            activitiesList.innerHTML = '';

            climber.scoreData.activities.forEach(activity => {
                const li = document.createElement('li');
                const score = Math.ceil(activity.score); // Round up the score
                const scoreColor = activity.score < climber.scoreData.minAverageScore ? 'red' : 'black'; // Color red if below minAverageScore
                li.innerHTML = `${activity.type}: <span style="color: ${scoreColor};">${score}</span>`; // Remove percentage sign
                activitiesList.appendChild(li);
            });

            averageScore.textContent = `Current Average Score: ${climber.scoreData.averageScore.toFixed(2)}`;
            minAvgScoreEl.textContent = `Minimum Average Score: ${climber.scoreData.minAverageScore.toFixed(2)}`;
            maxAvgScoreEl.textContent = `Maximum Average Score: ${climber.scoreData.maxAverageScore.toFixed(2)}`;

            const totalCurrentWeight = climber.scoreData.activities.reduce((acc, activity) => acc + activity.weight, 0);
            const newActivityWeight = 1;
            const recommendedScore = Math.ceil(calculateRecommendedScore(climber.scoreData.averageScore, climber.scoreData.minAverageScore, totalCurrentWeight, newActivityWeight));
            recommendedScoreEl.innerHTML = `<strong>Recommended score for the next activity:</strong> <span class="highlighted">${recommendedScore}</span>`;

            popupWindow.style.display = 'block';
        }
    });
});

// Event listener for the close button
document.getElementById('closeBtn').addEventListener('click', function() {
    document.getElementById('popupWindow').style.display = 'none';
});
