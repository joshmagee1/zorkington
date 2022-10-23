const { clear } = require('console');
const readline = require('readline');
const readlineInterface = readline.createInterface(process.stdin, process.stdout);

function ask(questionText) {
  return new Promise((resolve, reject) => {
    readlineInterface.question(questionText, resolve);
  });
}

/*Wanted to use console.table for some things, but didn't like how the top row
said "index" and "value". Found a nice function someone made here https://stackoverflow.com/a/69874540
to make a custom table. */
const { Console } = require('console');
const { Transform } = require('stream');
const { inspect } = require('util');
const { endianness } = require('os');

function table(input) {

    const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
    const logger = new Console({ stdout: ts })
    logger.table(input)
    const table = (ts.read() || '').toString()
    let result = '';
    for (let row of table.split(/[\r\n]+/)) {
    let r = row.replace(/[^┬]*┬/, '┌');
    r = r.replace(/^├─*┼/, '├');
    r = r.replace(/│[^│]*/, '');
    r = r.replace(/^└─*┴/, '└');
    r = r.replace(/'/g, ' ');
    result += `${r}\n`;
    }
    console.log(result);
}
// End of borrowed code here

//doesn't really need to be an object, but if I changed it I'd have to change a lot of code down the line
let player = {
  playerInv: ["wallet", "keys"]
}

class item {
  constructor(name, description, descInsp, itemUse){
    this.name = name,
    this.description = description
    this.descInsp = descInsp
    this.itemUse = itemUse
  }
}

let items = {
  "hand": new item("alien hand", " an alien hand", "A neatly severed hand with three fingers. Let's hope they washed it first.", "*high five* (high three?)"),
  "wallet": new item("wallet", " an old wallet", "Driver's licence, Blockerbuster membership card, no cash.", "You search for a vending machine in vain."),
  "keys": new item("keys", " a set of keys", "House key, car key, and a key you've forgotten the purpose of but you're\nafraid to throw it away.", "You click the key fob and hear nothing. Must've parked on another level."),
  "blaster": new item("blaster", " a strange alien weapon", "pew pew", "Wanting to look cool, you fire the blaster blindly. The bolt ricochets off the walls a few times before puncturing the hull and venting out all the atmosphere. I guess that was pretty cool.\n\n***YOU DIED***\n\n"),
  "crystal": new item("Zorkian crystal", " a finely cut purple crystal", "The crystal catches and refracts light in such a complex and mesmerizing way\nthat you feel dizzy at the thought of technology so incomprehensibly advanced.\nYou feel the same way about kaleidoscopes.", "You put the crystal to your forehead to absorb its healing energy. You feel sicker."),
  "keycard": new item("keycard", " a card with a barcode", "A keycard with a barcode and a picture of a smiling(?) alien.", "You swipe the keycard in the air. Nothing happens.")
}

class room {
  constructor(varName, valMove, name, roomInv, description){
    this.varName = varName,
    this.valMove = valMove,
    this.name = name,
    this.roomInv = roomInv,
    this.description = description
  }
}

let rooms = {
  "cell": new room("cell", ["north"], "Cell", [], "You are in a dirty cell. A door has opened up to the north"),
  
  "hall": new room("hall", ["north", "east", "south", "west"], "Hall", [], "You are in a long hallway. There is a door with strange writing on it to the north, a doorway to the east, and a door with a scanner to the west"),

  "translator": new room("translator", ["east"], "Tech Room", [], "You are in room full of all kinds of alien technological doodads. One in particular catches your eye: a helmet wired to a console with a red button and a green button"),
  
  "escapepods": new room("escapepods", ["west"], "Medical Bay", ["hand"], "You're in what appears to be some kind of medical bay. Surgical tools and mysteriously colored liquids are spilled everywhere. Whoever was working here left in a hurry"),
  
  "bridge": new room("bridge", ["north", "east", "south", "west"], "Bridge", [], `You are on the bridge of the ship. Through the main viewport you see the Earth from an angle you never you imagined you could see before. Floating outside the ship you see fire and wreckage everywhere. You think you can barely make lettering on a metal panel drifting by that reads "ISS". I guess that explains the crash. To the north you see a door labeled "Portal Room", to the east a door labeled "Storage", to the west a door labeled "Archives", and to the south a door to the hall`),
  
  "teleporter": new room("teleporter", ["south"], "Teleporter Room", ["keycard"], `You're in the room your kidnappers must have used to escape after the crash. You see a large metal circle with blinking lights near a console. Next to the console is a port labeled "Insert Zorkian Crystal Here". Half of what looks like some poor alien lies next to the metal circle`),
  
  "storage": new room("storage", ["north", "east", "west"], "Storage Bay", [], `You're in a the storage bay. Boxes and alien gizmos knocked loose from the collision are strewn about the place. To the east is a doorway marked "Armory" and to the north is a doorway marked "Zorkian Crystal Storage". At the north end of the room you see a broken cage with a creature neat it that looks like something halfway between a rhinocerous, a hedgehog, and a Ford Explorer. It seems too busy chewing on something blue to notice you`),
  
  "armory": new room("armory", ["west"], "Armory", ["blaster"], "You're in a room where all kinds of alien weaponry fills the walls, most of it in locked cases. The crash seems to have knocked some of it loose"),
  
  "crystals": new room("crystals", ["south"], "Crystal Storage", ["crystal"], "You're in a room filled with brilliantly shining crystals. Unfortunately almost all of them appear to have been broken in the crash"),

  "archives": new room("archives", ["east"], "Archives", [], "You're in the archives. The walls are covered in blinking lights and winding wires. There's a working console at the far end of the room that looks like it needs a keycard to grant access")
}

/*creates various properties in each room object that will allow the
moveLocation function to reassign roomCurrent*/
rooms.cell.north = rooms.hall.varName

rooms.hall.north = rooms.bridge.varName
rooms.hall.east = rooms.escapepods.varName
rooms.hall.south = rooms.cell.varName
rooms.hall.west = rooms.translator.varName

rooms.translator.east = rooms.hall.varName

rooms.escapepods.west = rooms.hall.varName

rooms.bridge.north = rooms.teleporter.varName
rooms.bridge.east = rooms.storage.varName
rooms.bridge.south = rooms.hall.varName
rooms.bridge.west = rooms.archives.varName

rooms.teleporter.south = rooms.bridge.varName

rooms.storage.north = rooms.crystals.varName
rooms.storage.east = rooms.armory.varName
rooms.storage.west = rooms.bridge.varName

rooms.armory.west = rooms.storage.varName

rooms.crystals.south = rooms.storage.varName

rooms.archives.east = rooms.bridge.varName

//a few mutable states that change as the player progresses
let roomCurrent = "cell" //current room
let scannerLock = true //changes when the player uses the alien hand in the hall
let creatureDead = false //changes when the player uses the weapon in the storage room
let crystalIn = false //changes when the playes uses the crystal in the teleporter room
let knowLang = 2 //changes in the learnLang function, changes hall description and valid directions when it = 4
let oldLang = 2 //used in learnLang

//a list of valid words, separated into categories to condense sorting
let wordList = [
  ["l", "look"], //0
  ["n", "north", "e", "east", "s", "south", "w", "west"], //1
  ["hand", "alien", "severed", "wallet", "keys", "blaster", "crystal", "weapon", "purple", "card", "keycard", "gun"], //2
  ["take", "grab"], //3
  ["go", "move", "walk"], //4
  ["drop"], //5
  ["i", "inv", "inventory"], //6
  ["use"], //7
  ["inspect"], //8
  ["helmet", "console"], //9
  ["help"] //10
];

//an easier array of the valid words for the start() await to search through
let allWords = [];
wordList.forEach(i => i.forEach(t => allWords.push(t)));

begin();

async function begin() {
  console.log(`\n182 Main St.
  You are standing on Main Street between Church and South Winooski.
  There is a door here. A keypad sits on the handle.
  On the door is a handwritten sign.\n`)
  await ask(">")
  taken()
}

async function taken() {
  clear()
  console.log(`\nBefore you can do anything a bright light appears above you. As you look up you feel yourself\nbeing lifted off the ground miraculously. You black out as Burlington fades away.\nYou're woken up by a loud crash and flashing lights. You find yourself in an entirely unfamiliar environment.\nWhatever that crash was has opened up your cell door.\n`)
  await ask(">")
  status()
  start()
}

//parses through player input
async function start() {
  let answer = await ask(">");
  answer = (answer).toLowerCase().trim().split(" ")
  answer == "" ? (status(), start())
    : answer.every(i => allWords.includes(i) ? parser() //checks if input is in wordList
    : (status(), (console.log(`I'm not sure what "${i}" is\n`)), start())) //log if word isn't found
function parser() {
  let verb = answer[0]; //first word
  let noun = answer[1]; //second word
  //various word combos work together and move to new functions, could be cleaned up in places but works well for now
  wordList[0].includes(verb) && noun == undefined ? (status(), start())
  : wordList[1].includes(verb) && noun == undefined ? moveLocation(verb)
  : wordList[1].includes(noun) && wordList[4].includes(verb) ? moveLocation(noun)
  : wordList[3].includes(verb) && wordList[2].includes(noun) ? takeItem(noun)
  : wordList[5].includes(verb) && wordList[2].includes(noun) ? dropItem(noun)
  : wordList[6].includes(verb) && noun == undefined ? showInv()
  : wordList[8].includes(verb) && wordList[2].includes(noun) ? inspectItem(noun)
  : wordList[7].includes(verb) && wordList[9].includes(noun) && roomCurrent == "translator" && knowLang == 4 ? (status(), console.log("You've had enough learning for one day"), start())
  : wordList[7].includes(verb) && wordList[9].includes(noun) && roomCurrent == "translator" ? learnLang()
  : wordList[7].includes(verb) && wordList[2].includes(noun) ? useItem(noun)
  : wordList[7].includes(verb) && noun == "console" && roomCurrent == "archives" ? useItem("keycard")
  : wordList[7].includes(verb) && noun == "console" && roomCurrent == "teleporter" ? useItem("console")
  : verb == "help" && noun == undefined ? help()
  : (status(), console.log(`I'm not sure how to use "${noun}" with "${verb}"\n`), start()); //if valid words are inputed but have no use, log this and kick user back up
}
} 

//creates a dynamic description depending on player location and state of the room/roomInv
function status() {
  clear();
  console.log("Type [help] for a list of commands")
  let floor, floorPop, roomInvLog, examine, descFirst, wrapOne, wrapTwo, wrapThree, wrapFour, wrapFive, wrapSix, wrapSeven, wrapEight, wrapNine, wrapTen
  examine = `\n${rooms[roomCurrent].name}\n\n${rooms[roomCurrent].description}` //room name and description
  rooms[roomCurrent].roomInv.length > 0 //checks if room has items
  ? (floor = rooms[roomCurrent].roomInv.map(i => items[i].description), //assigns roomInv item descriptions to a variable
    roomInvLog = ". On the ground you see") //beginning text if the room has items
  : (floor = "", roomInvLog = "") //empty string if the room is empty
  floor.length > 1 ? floorPop = `, and${floor.pop()}` : floorPop = "" //if there's more than one item, adds "and"
  descFirst = `${examine}${roomInvLog}${floor}${floorPop}.\n` //combines all these values into one string
  /*text wrapper: reads the length of descFirst and splices string at the first space after set intervals.
    As my description grew longer so did my number of necessary wraps. I'm aware of the monster I've created but
    I don't have the time to create something new.*/
  wrapOne = descFirst.slice(0, descFirst.indexOf(" ", 80))
  wrapTwo = descFirst.slice(descFirst.indexOf(" ", 80) + 1, descFirst.indexOf(" ", 160))
  wrapThree = descFirst.slice(descFirst.indexOf(" ", 160) + 1, descFirst.indexOf(" ", 240))
  wrapFour = descFirst.slice(descFirst.indexOf(" ", 240) + 1, descFirst.indexOf(" ", 320))
  wrapFive = descFirst.slice(descFirst.indexOf(" ", 320) + 1, descFirst.indexOf(" ", 400))
  wrapSix = descFirst.slice(descFirst.indexOf(" ", 400) + 1, descFirst.indexOf(" ", 480))
  wrapSeven = descFirst.slice(descFirst.indexOf(" ", 480) + 1, descFirst.indexOf(" ", 560))
  wrapEight = descFirst.slice(descFirst.indexOf(" ", 560) + 1, descFirst.indexOf(" ", 640))
  wrapNine = descFirst.slice(descFirst.indexOf(" ", 640) + 1, descFirst.indexOf(" ", 720))
  wrapTen = descFirst.slice(descFirst.indexOf(" ", 720) + 1, descFirst.indexOf(" ", 800))
  descFirst.length <= 80 ? console.log(`${wrapOne}\n`)
  :descFirst.length <= 160 ? console.log(`${wrapOne}\n${wrapTwo}\n`)
  :descFirst.length <= 240 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n`)
  :descFirst.length <= 320 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n${wrapFour}\n`)
  :descFirst.length <= 400 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n${wrapFour}\n${wrapFive}\n`)
  :descFirst.length <= 480 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n${wrapFour}\n${wrapFive}\n${wrapSix}\n`)
  :descFirst.length <= 560 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n${wrapFour}\n${wrapFive}\n${wrapSix}\n${wrapSeven}\n`)
  :descFirst.length <= 640 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n${wrapFour}\n${wrapFive}\n${wrapSix}\n${wrapSeven}\n${wrapEight}\n`)
  :descFirst.length <= 720 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n${wrapFour}\n${wrapFive}\n${wrapSix}\n${wrapSeven}\n${wrapEight}\n${wrapNine}\n`)
  :descFirst.length > 800 ? console.log(`${wrapOne}\n${wrapTwo}\n${wrapThree}\n${wrapFour}\n${wrapFive}\n${wrapSix}\n${wrapSeven}\n${wrapEight}\n${wrapNine}\n${wrapTen}\n`)
  : console.log(descFirst)
}

//simplifies inputs for functions down the line
function moveLocation(direction) {
  direction == "n" ? direction = "north"
  : direction == "e" ? direction = "east"
  : direction == "s" ? direction = "south"
  : direction == "w" ? direction = "west"
  : null
  //special cases for if the player tries to move in a direction that is "locked"
  if(direction == "north" && knowLang != 4 && roomCurrent == "hall"){
    status();
    console.log("You push with all your might but the door doesn't budge.\n")
  } else if(direction == "west" && scannerLock == true && roomCurrent == "hall"){
    status();
    console.log("The door is locked. There's a scanner here that looks like it accepts a hand\nwith three fingers.\n")
  } else if(direction == "north" && creatureDead == false && roomCurrent == "storage"){
    status();
    console.log("You try to nonchalantly walk by the creature. It isn't fooled and you are swiftly eaten.\n\n***YOU DIED***\n")
    /*checks if the chosen direction is in the current rooms valMove property, and if so,
    assigns roomCurrent to the room associated with that rooms property for that direction*/
  } else if(rooms[roomCurrent].valMove.includes(direction)) {
    switch(direction) {
      case "north" : roomCurrent = rooms[roomCurrent].north, status();
      break;
      case "east" : roomCurrent = rooms[roomCurrent].east, status();
      break;
      case "south" : roomCurrent = rooms[roomCurrent].south, status();
      break;
      case "west" : roomCurrent = rooms[roomCurrent].west, status();
      break; 
    }
  } else {
    status(), console.log(`You can't go ${direction} from here\n`);
  }
  start();
}

//switch to simplify item names from a few possible user inputs for each item
function itemCleanse(cleanItem) {
  switch (cleanItem) {
    case "hand":
    case "alien":
    case "severed": return "hand"
    case "wallet": return "wallet"
    case "keys": return "keys"
    case "gun":
    case "weapon":
    case "blaster": return "blaster"
    case "purple":
    case "crystal": return "crystal"
    case "card":
    case "keycard": return "keycard"
    case "console": return "console"
  }
}

//function to pick up an item in the room
function takeItem(obj) {
  obj = itemCleanse(obj);
  if(rooms[roomCurrent].roomInv.includes(obj)) { //checks if the room contains the item
    rooms[roomCurrent].roomInv.splice(rooms[roomCurrent].roomInv.indexOf(obj), 1); //removes that item from the rooms roomInv array
    player.playerInv.push(obj); //adds the items to the players playerInv array
    status();
    console.log(`You picked up the ${items[obj].name}.\n`);
    start();
  } else {
    status();
    console.log(`There is no ${items[obj].name} here.\n`); //log if there's no matching item in the room
    start();
  }
}

//same as takeItem, but in reverse
function dropItem(obj) {
  obj = itemCleanse(obj);
  if(player.playerInv.includes(obj)) {
    player.playerInv.splice(player.playerInv.indexOf(obj), 1);
    rooms[roomCurrent].roomInv.push(obj);
    status();
    console.log(`You dropped the ${items[obj].name}.\n`);
    start();
  } else {
    status();
    console.log(`You dont have the ${items[obj].name}.\n`);
    start();
  }
}

//creates an array of objects using the names/descriptions of items in playerInv, then runs that through the table function
function showInv() {
  clear();
  console.log("") //spacing it from the top of the screen
  if(player.playerInv.length > 0){ //checks if the player is holding nothing. If so, console logs that
  let invArr = [] //where the item objects get pushed
  player.playerInv.forEach(i => (invArr.push({"Item": " ", "Description": " "}), //spacing at top of table
    invArr.push({"Item": items[i].name, "Description": items[i].description}) //turns each item in playerInv into on object and pushes that object into invArr
  ));
  invArr.push({"Item": " ", "Description": " "}); //creates spacing at the bottom of the table to make it look nice
  table(invArr)
  }else {status(), console.log("You're not holding anything\n")};
  start()
}

//show an items long description
function inspectItem(item) {
  item = itemCleanse(item)
  status();
  console.log(`${items[item].descInsp}\n`)
  start();
}

//the alien doodad in the translator room
function learnLang() {
  clear()
  console.log("\nYou put on the helmet.") //initial console log
  langSwitch()
  /*loops back here until the highest or lowest level is reached
  knowLang starts at 2 and loop ends if it = 4 or 0. Direction of movement is tracked by oldLang
  which also starts at 2. At each move oldLang is set to knowLang and knowLang is incremented */
  async function langSwitch() {
    let buttonPush = await ask("\nDo you push the green button, the red button, or exit?\n\n>")
    buttonPush = buttonPush.toLowerCase().trim()
    buttonPush == "red" ? (oldLang = knowLang, knowLang--, clear(), langOutput())
    : buttonPush == "green" ? (oldLang = knowLang, knowLang++, clear(), langOutput())
    : buttonPush == "exit" ? (status(), console.log("You remove the helmet.\n"), start())
    : (clear(), console.log("\nYou accidentally hit both buttons at once and lose a childhood memory."), langSwitch())
  }
  //detects knowLang and oldLang, outputs logs depending on direction of movement
  function langOutput() {
    let helmLight = "\nThe helmet flashes and beeps.\n\n"
    knowLang == 3 && oldLang == 2 ? (console.log(`${helmLight}You feel like you know Latin. Ye esse adhuc stultus quamquam.`), langSwitch())
    : knowLang == 4 && oldLang == 3 ? (console.log(`${helmLight}You've learned a language that you now know is called Zorkian! A voice informs you\nthat your free trial has expired and the helmet shuts off.\n`), 
      rooms.hall.description = `You are in a long hallway. There is a doorway to the east, and a door with a keypad to the west, and a door to the north that says "pull". Oh`, start())
    : knowLang == 2 && oldLang == 3 ? (console.log(`${helmLight}You've forgotten Latin. Some languages should stay dead.`), langSwitch())
    : knowLang == 1 && oldLang == 2 ? (console.log(`${helmLight}You've forgotten all the Spanish you learned in high school. Not that you remembered much anyway.`), langSwitch())
    : knowLang == 0 && oldLang == 1 ? (console.log(`\nBejuw bnapeuv uawdh huw huw\n\nWbkwyn gkeuug njywgh gkkueywhh bf ejj wwhfj.`), noLang())
    : knowLang == 2 && oldLang == 1 ? (console.log(`${helmLight}You know Spanish better than you ever did. Take that, public education system.`), langSwitch())
    : null
  }
  //separate function here to display gibberish instead of the normal prompts
  async function noLang() {
    let helmLight = "\nThe helmet flashes and beeps.\n\n"
    let almostDead = await ask("\nDjwybvri gjktu wngkku whh tkbu rhhw jdwuhw?\n\n>")
    almostDead = almostDead.toLowerCase().trim()
    almostDead == "green" ? (oldLang == knowLang, knowLang++, clear(), console.log(`${helmLight}Probably shouldn't hit that button again.`), langSwitch())
    : almostDead == "red" ? (clear(), console.log("\nWdjkjd nwnid ndiwwa\n\n***YOU DIED***\n\n"), playAgain())
    : (clear(), console.log("\njwdawdk kjwdkawj kjwdkawj"), noLang())
  }
}

//mostly special cases for when user inputs "use [item]". If no special case is read, outputs a generic use message for the item
function useItem(item) {
  item = itemCleanse(item)
  status();
  item == "console" && roomCurrent == "teleporter" && crystalIn == false ? (status(), console.log("The console doesn't seem to be activated.\n"), start())
  : item == "console" && roomCurrent == "teleporter" && crystalIn == true ? (clear(), teleporter())
  : !player.playerInv.includes(item) && !rooms[roomCurrent].roomInv.includes(item) ? (status(), console.log("You don't have one of those.\n"), start())
  : item == "hand" && roomCurrent == "hall" ? (status(), console.log("You put the hand on the scanner and it gives a cheerful beep as the door slides open.\n"), scannerLock = false, start())
  : item == "blaster" && roomCurrent == "storage" && creatureDead == false ? (status(),
    console.log("You fire the blaster at the creature with all all the confidence of someone who really\nshouldn't be handling something that dangerous. Your shot strikes true and the creature\nfalls with a loud yelp and a single tear.\n\nYou monster.\n"),
    creatureDead = true, rooms.storage.description = `You're in a the storage bay. Boxes and alien gizmos knocked loose from the collision are strewn about the place. To the east is a doorway marked "Armory" and to the north is a doorway marked "Zorkian Crystal Storage".`, start())
  : item == "blaster" && roomCurrent == "storage" && creatureDead == true ? (status(), console.log("You blast the dead creature again for good measure. It doesn't make you feel any better.\n"), start())
  : item == "keycard" && roomCurrent == "archives" ? (clear(), console.log("\nAccess Granted!\n"), compDisplay())
  : item == "blaster" ? (console.log(`${items[item].itemUse}\n`), playAgain()) //practice gun safety, kids
  : item == "crystal" && roomCurrent == "teleporter" ? (status(), console.log("The console near you lights up.\n"), crystalIn = true, start())
  : console.log(`${items[item].itemUse}\n`)
  start()
}

//table for the console in the archives
function compDisplay() {
  let coords = [
    {"Code": "2 8 4 7", "Destination": "Sand"},
    {"Code": "5 8 3 2", "Destination": "Earth"},
    {"Code": "8 3 9 4", "Destination": "Egg"},
    {"Code": "2 9 8 7", "Destination": "Snow"},
  ]
  table(coords)
  start()
}

//codes from the archives console give the player a unique ending, otherwise they are given a generic death ending
async function teleporter() {
    let input = await ask ("\nPlease input code for portal destination: ")
    let outro = "\nYou enter the coordinates and the metal circle whirs life, creating a beautiful swirling portal.\n\nYou take a deep breath and step through.\n\n"
    input == "5832" ? (clear(), console.log(`${outro}You find yourself right back where you started, only slightly worse for wear.\nYou take a moment to reflect on your experience before proceeding upstairs to register for\nthe next coding bootcamp.\n\n***YOU WIN!***\n\n`), playAgain())
    : input == "2847" ? (clear(), console.log(`${outro}You land with a thud onto the sand under a hot desert sun. There's nothing but sand dunes\nas far as the eye can see. As you set off walking you hear an ominous distant\nrumbling and see the sand start to shift in the distance.\n\n***YOU DIED***\n\n`), playAgain())
    : input == "8394" ? (clear(), console.log(`${outro}You're in a dank, dark room. You shuffle around in the dark for a few minutes\nas your eyes adjust to the light. You begin to make out dozens of oval shaped objects. One of them begins to shift and a spidery arm folds out.\n\n***YOU DIED***\n\n`), playAgain())
    : input == "2987" ? (clear(), console.log(`${outro}You land on a frigidly cold, snowy planet with ships flying everywhere overhead. You look in\namazement as a giant mechanical vehicle steps over you. You amazement is quickly cut short by a stray blaster bolt.\n\n***YOU DIED***`), playAgain())
    : input == "42" ? (clear(), console.log(`${outro}Against all probibility you somehow ended up in a safe spot in the vast\nemptiness of space. You hear a sad robotic voice inform someone of an intruder.\nSomeone wraps a towel around your head from behind.\n\n***YOU DIED***`), playAgain())
    : (clear(), console.log(`${outro}You find yourself somewhere in the vast emptiness of space.\nMaybe you should have paid more attention in your statistics class.\n\n***YOU DIED***\n\n`), playAgain())
}

async function playAgain() {
  let again = await ask("\nWould you like to play again? Y / N\n\n>")
  again = again.toLowerCase().trim()
  again == "y" ? (clear(), reset(), begin())
  : again == "n" ? process.exit()
  : (clear(), playAgain())
}

//resets all mutable values to default
function reset() {
  rooms.roomInv = [];
  player.playerInv = ["wallet", "keys"];
  rooms.escapepods.roomInv = ["hand"];
  rooms.armory.roomInv = ["blaster"];
  rooms.teleporter.roomInv = ["keycard"];
  rooms.crystals.roomInv = ["crystal"];
  scannerLock = true;
  creatureDead = false;
  crystalIn = false;
  knowLang = 2;
  oldLang = 2;
  roomCurrent = "cell"
}

function help() {
  clear()
  console.log(`\n[inspect]: inspect an item\n[look] / [l]: room description\n[n] / [north] / [go north] etc: move that direction\n[take] / [grab] "item": take that item\n[drop] "item": drop that item\n[i] / [inv] / [inventory]: show player inventory\n[use] "item": use that item or certain room objects\n[inspect] "item": item description\n[help]: this screen\n`)
  start()
}