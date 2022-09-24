//#region classes
class Vector2 
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    add(vecIn) 
    {
        this.x += vecIn.x;
        this.y += vecIn.y;
    }

    equals(vecIn)
    {
        return this.x === vecIn.x && this.y === vecIn.y;
    }
}
//#endregion
const samplePuzzles = [
    [
        [0,4,0,0,0,0,0,0],
        [0,0,0,3,0,0,0,0],
        [4,4,0,0,0,0,4,0],
        [0,0,0,0,0,0,0,0],
        [3,0,0,4,0,0,0,0],
        [3,0,3,0,0,0,0,4],
        [0,0,0,0,0,3,3,0],
        [0,4,0,0,4,0,3,0],
    ],
    [
        [0,0,4,0,0,3,0,0],
        [0,0,4,0,4,0,4,0],
        [4,0,0,0,0,0,0,0],
        [0,0,0,3,0,4,0,0],
        [3,0,3,0,0,0,0,0],
        [0,4,0,0,3,0,0,4],
        [0,0,0,4,3,0,0,4],
        [0,0,0,3,0,3,0,0],
    ], //seed 8x8dt#155504338199982 (trivial)
];
const cellGrid = document.getElementById("cellGrid");
const solverSquare = document.getElementById("solverSquare");
const cellValues = []; //a cell value of 0 is unfilled; 1 is black, 2 is white, 3 is permanent black, 4 is permanent white
const gridSize = 8;
const cellCount = gridSize * gridSize;
const colors = [0, 1, 2, 3, 4];
const [empty, black, white, blackPermanent, whitePermanent] = colors;
const oppositeColors = new Map([
    [black, white],
    [blackPermanent, white],
    [white, black],
    [whitePermanent, black],
]);
const directions = 
[
    new Vector2(-1, 0),
    new Vector2(0, -1),
    new Vector2(1, 0),
    new Vector2(0, 1)
];
const [left, up, right, down] = directions;
var solverPosition = 0;

createGrid();
setPuzzle(samplePuzzles[1]);
//testSolution();


//#region functions
const getColumn = columnX => cellValues[columnX];
const getRow = rowY => cellValues.map(column => column[rowY]);

function areColorsEqual(color1, color2)
{
    if (color1 + color2 === 0) { return true; }
    if (color1 === 0 || color2 === 0) { return false; }
    return color1 % 2 === color2 % 2;
}

function createGrid() 
{
    for (let i = 0; i < gridSize * gridSize; i++)
    {
        createCell(i);
    }
    for (let x = 0; x < gridSize; x++)
    {
        cellValues[x] = [];
        for (let y = 0; y < gridSize; y++)
        {
            cellValues[x][y] = empty;
        }
    }
}

function setPuzzle(puzzle)
{
    for (let x = 0; x < puzzle[0].length; x++)
    {
        for (let y = 0; y < puzzle.length; y++)
        {
            setCellPermanent(x, y, puzzle[y][x]);
        }
    }
}

function testSolution()
{
    let solution = 
    [
        [1,2,1,2,1,2,2,1],
        [1,1,2,1,2,2,1,2],
        [2,2,1,2,1,1,2,1],
        [2,1,2,1,2,1,1,2],
        [1,1,2,2,1,2,2,1],
        [1,2,1,2,1,1,2,2],
        [2,1,2,1,2,1,1,2],
        [2,2,1,1,2,2,1,1],
    ];

    for (let x = 0; x < 8; x++)
    {
        for (let y = 0; y < 8; y++)
        {
            let val = solution[y][x];
            let existing = cellValues[x][y];
            if (existing === whitePermanent || existing === blackPermanent) { continue; }
            cellValues[x][y] = val;
            updateCellVisual(x, y);
        }
    }
}

function advance()
{
    solveAtIndex(solverPosition);
    solverPosition++;
    if (solverPosition > 63) { solverPosition = 0; }
    console.log("Advancing to index " + solverPosition);
    updateSolverSquareVisual();
}

function updateSolverSquareVisual()
{
    let x = solverPosition % gridSize;
    let y = Math.trunc(solverPosition / gridSize);
    solverSquare.style.left = x * 40 - 1 + "px";
    solverSquare.style.top = y * 40 - 1 + "px";
}

function solveAtIndex(solverPosition)
{
    console.log("Trying to solve at index " + solverPosition);
    let x = solverPosition % gridSize;
    let y = Math.trunc(solverPosition / gridSize);
    if (cellValues[x][y] !== 0) { return; }
    let position = new Vector2(x, y);
    let colorHere = getColorAt(x, y);
    let neighborhoodValues = directions.map(direction => getValuesInDirection(position, direction));
    let valToSet = 0;
    valToSet = deduceFromDoubleAdjacent(neighborhoodValues);
    if (valToSet === 0) { valToSet = deduceFromFlanking(neighborhoodValues); }
    if (valToSet === 0) { valToSet = deduceFromColorCount(getColumn(x), getRow(y)); }
    if (valToSet !== 0)
    {
        console.log("Deduced " + valToSet);
        cellValues[x][y] = valToSet;
        updateCellVisual(x, y);
    }
    //let position = new Vector2(x, y);
    //if (countAdjacentInDirection(position, white, left) === 2 ||
    //countAdjacentInDirection(position, white, left) === 2 ||
    //countAdjacentInDirection(position, white, left) === 2 ||
    //countAdjacentInDirection(position, white, left) === 2)
    //{
    //    //set to white
    //}
}

function deduceFromDoubleAdjacent(neighborhoodValues)
{
    let valToSet = 0;

    neighborhoodValues.map(valuePair => {
        let [val1, val2] = valuePair;
        let equal = areColorsEqual(val1, val2);
        if (valToSet === 0 && valuePair.length === 2 && equal && val1 !== 0)
        {
            valToSet = oppositeColors.get(val1);
        }
    });

    return valToSet;
}

function deduceFromFlanking(neighborhoodValues)
{
    let valToSet = 0;
    let neighborValues = neighborhoodValues.map(item => {
        if (item.length > 0) { return item[0]; }
        return undefined;
    })
    let [left, top, right, bot] = neighborValues;
    if (left + right > 0 && areColorsEqual(left, right)) { valToSet = oppositeColors.get(left); }
    if (top + bot > 0 && areColorsEqual(top, bot)) { valToSet = oppositeColors.get(top); }
    return valToSet;
}

function deduceFromColorCount(column, row)
{
    console.log(`Column length ${column.length}, row length ${row.length}`);
    let blackInColumn = column.reduce((accumulator, value) => {
        if (areColorsEqual(value, black)) { accumulator++; }
        return accumulator;
    }, 0);
    let blackInRow = row.reduce((accumulator, value) => {
        if (areColorsEqual(value, black)) { accumulator++; }
        return accumulator;
    }, 0);
    let whiteInColumn = column.reduce((accumulator, value) => {
        if (areColorsEqual(value, white)) { accumulator++; }
        return accumulator;
    }, 0);
    let whiteInRow = row.reduce((accumulator, value) => {
        if (areColorsEqual(value, white)) { 
            console.log(value + " is white"); 
            accumulator++; 
        }
        return accumulator;
    }, 0);
    console.log(`Black in column: ${blackInColumn}; black in row: ${blackInRow}; whiteInColumn: ${whiteInColumn}; whiteInRow: ${whiteInRow}`);

    if (blackInColumn === gridSize / 2 || blackInRow === gridSize / 2) { return white; }
    if (whiteInColumn === gridSize / 2 || whiteInRow === gridSize / 2) { return black; }
    return 0;
}

function getValuesInDirection(startPos, direction, count = 2)
{
    let values = [];
    let curPos = new Vector2(startPos.x, startPos.y);
    let curCount = 0;
    curPos.add(direction);
    while (isInBounds(curPos.x, curPos.y) && curCount < count)
    {
        values.push(cellValues[curPos.x][curPos.y]);
        curPos.add(direction);
        curCount++;
    }
    return values;
}

function countAdjacentInDirection(startPos, color, direction)
{
    console.log("Counting adjacent");
    //how to check if parameters are vector2s??
    if (!isValidDirection(direction))
    {
        console.log("ERROR: Invalid direction!");
        return 0;
    }
    if (!colors.includes(color))
    {
        console.log("ERROR: Invalid color!");
        return 0;
    }
    let count = 0;
    let curPos = startPos;
    curPos.add(direction);
    while (isInBounds(curPos.x, curPos.y) && getColorAt(curPos.x, curPos.y) === color)
    {
        console.log("color matches; checking next cell");
        count++;
        curPos.add(direction);
    }
    return count;
}

function click(index)
{
    let clickedX = index % gridSize;
    let clickedY = Math.trunc(index / gridSize);
    // console.log("Clicked " + clickedX + ", " + clickedY);
    modifyCell(clickedX, clickedY);
}

function getColorAt(x, y)
{
    if (!isInBounds(x, y))
    {
        console.log("ERROR: No cell at " + x + ", " + y + "!");
        return -1;
    }
    return cellValues[x][y];
}

function isValidDirection(direction)
{
    return direction.equals(left) || direction.equals(up) ||
    direction.equals(right) || direction.equals(down);
}

function isInBounds(x, y)
{
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

function setCellPermanent(x, y, value)
{
    if (value !== blackPermanent && value !== whitePermanent) { return; }
    let index = y * gridSize + x;
    cellValues[x][y] = value;
    updateCellVisual(x, y);
}

function modifyCell(x, y)
{
    let valHere = cellValues[x][y];
    if (valHere === blackPermanent || valHere === whitePermanent)
    {
        return;
    }
    cellValues[x][y]++;
    if (cellValues[x][y] > white)
    {
        cellValues[x][y] = empty;
    }
    updateCellVisual(x, y);
}

function updateCellVisual(x, y)
{
    console.log("updating");
    let index = (gridSize * y) + x;
    let valHere = cellValues[x][y];
    // console.log("value here is " + valHere);
    let cell = document.getElementById("cell" + index);
    if (valHere === black)
    {
        cell.classList.remove("white");
        cell.classList.add("black");
    }
    else if (valHere === white)
    {
        cell.classList.remove("black");
        cell.classList.add("white");
    }
    else if (valHere === empty) { cell.classList.remove("white"); }
    else if (valHere === blackPermanent) {cell.classList.add("blackPermanent");}
    else if (valHere === whitePermanent) {cell.classList.add("whitePermanent");}
    else { console.log("invalid value at " + x + ", " + y); }
}

function createCell(index) 
{
    let newCell = document.createElement("div");
    let innerDiv = document.createElement("div");
    newCell.classList.add("cell");
    newCell.id = "cell" + index;
    newCell.addEventListener("click", function() {click(index)});
    newCell.appendChild(innerDiv);
    cellGrid.appendChild(newCell);
}
//#endregion