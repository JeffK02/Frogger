import "./style.css";
import { fromEvent, interval} from 'rxjs'; 
import { map, filter, scan, merge , mergeMap,subscribeOn} from 'rxjs/operators';

function main() {
  const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;

  //adding ground and river section
  const ground = document.createElementNS(svg.namespaceURI, "rect");
    ground.setAttribute("width", "600");
    ground.setAttribute("height", "180");
    ground.setAttribute("x", "0");
    ground.setAttribute("y", "360");
    ground.setAttribute("fill","#d7b995");
    svg.appendChild(ground);

  const river = document.createElementNS(svg.namespaceURI, "rect");
    river.setAttribute("width", "600");
    river.setAttribute("height", "180");
    river.setAttribute("x", "0");
    river.setAttribute("y", "60");
    river.setAttribute("fill","#95B3D7");
    svg.appendChild(river);
  
  //adding elements of the game
  const score = document.createElementNS(svg.namespaceURI,"text")
    score.setAttribute("id", "score");
    score.setAttribute("x", "0"),
    score.setAttribute("y", "560"),
    score.setAttribute("style", "fill: white"),
    score.setAttribute("font-size", "25"),
    score.textContent = "Highscore: ";
    svg.appendChild(score);

  const highScore = document.createElementNS(svg.namespaceURI,"text")
    highScore.setAttribute("id", "highScore");
    highScore.setAttribute("x", "0"),
    highScore.setAttribute("y", "585"),
    highScore.setAttribute("style", "fill: white"),
    highScore.setAttribute("font-size", "25"),
    highScore.textContent = "High score: ";
    svg.appendChild(highScore);

  const frog = document.createElementNS(svg.namespaceURI, "rect")
      frog.setAttribute("id", "frogger")
      frog.setAttribute("x", String(240))
      frog.setAttribute("y", String(540))
      frog.setAttribute("width", String(60))
      frog.setAttribute("height", String(60))
      frog.setAttribute("fill", '#00FF00')
      svg.appendChild(frog)

  const log1 = document.createElementNS(svg.namespaceURI, "rect")
      log1.setAttribute("id", "r1Obs")
      log1.setAttribute("x", String(-200))
      log1.setAttribute("y", String(60))
      log1.setAttribute("width", String(200))
      log1.setAttribute("height", String(60))
      log1.setAttribute("fill", '#808000')
      svg.appendChild(log1)

  const log2 = document.createElementNS(svg.namespaceURI, "rect")
      log2.setAttribute("id", "r2Obs")
      log2.setAttribute("x", String(600))
      log2.setAttribute("y", String(120))
      log2.setAttribute("width", String(200))
      log2.setAttribute("height", String(60))
      log2.setAttribute("fill", '#808000')
      svg.appendChild(log2)

  const log3 = document.createElementNS(svg.namespaceURI, "rect")
      log3.setAttribute("id", "r3Obs")
      log3.setAttribute("x", String(-200))
      log3.setAttribute("y", String(180))
      log3.setAttribute("width", String(200))
      log3.setAttribute("height", String(60))
      log3.setAttribute("fill", '#808000')
      svg.appendChild(log3)

  const car1 = document.createElementNS(svg.namespaceURI, "rect")
      car1.setAttribute("id", "r4Obs")
      car1.setAttribute("x", String(600))
      car1.setAttribute("y", String(360))
      car1.setAttribute("width", String(200))
      car1.setAttribute("height", String(60))
      car1.setAttribute("fill", '#FF0000')
      svg.appendChild(car1)

  const car2 = document.createElementNS(svg.namespaceURI, "rect")
      car2.setAttribute("id", "r5Obs")
      car2.setAttribute("x", String(-200))
      car2.setAttribute("y", String(420))
      car2.setAttribute("width", String(200))
      car2.setAttribute("height", String(60))
      car2.setAttribute("fill", '#FF0000')
      svg.appendChild(car2)

  const car3 = document.createElementNS(svg.namespaceURI, "rect")
      car3.setAttribute("id", "r6Obs")
      car3.setAttribute("x", String(600))
      car3.setAttribute("y", String(480))
      car3.setAttribute("width", String(200))
      car3.setAttribute("height", String(60))
      car3.setAttribute("fill", '#FF0000')
      svg.appendChild(car3)

  
  /**
   * Inside this function you will use the classes and functions from rx.js
   * to add visuals to the svg element in pong.html, animate them, and make them interactive.
   *
   * Study and complete the tasks in observable examples first to get ideas.
   *
   * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
   *
   * You will be marked on your functional programming style
   * as well as the functionality that you implement.
   *
   * Document your code!
   */

  /**
   * This is the view for your game to add and update your game elements.
   */

  class Move { constructor(public readonly x: number, public readonly y: number) {} }
  
  // Constants class that contains all of the required constant
  // prevent us to override the value as well
  const Constants = new class{
    readonly CanvasWidth = 600
    readonly CanvasHeight = 600
    readonly FrogInitialX = 240
    readonly FrogInitialY = 540
    readonly FrogWidth = 60
    readonly FrogHeight = 60
    readonly ObstacleSpeedLeft = 1 + Math.random()
    readonly ObstacleSpeedRight = -1 - Math.random()
    readonly ObstacleHeight = 60
    readonly ObstacleWidth = 200
    readonly InitialScore = 0
    readonly GameOverText = "Game Over"
  }

  // all of the properties here are straight forward
  type Frog = {id: string, y: number, x: number, w: number, h: number, alive: boolean}
  type log = {id: string, y: number, x: number, w: number, h: number, speed: number}
  type car = {id: string, y: number, x: number, w: number, h: number, speed: number}
  type State = {Frog: Frog, r1: log, r2: log, r3: log, r4: car, r5: car, r6: car, gameOver: boolean, score: number, highscore: number}
  
  // initial state of frogger and obstacle and the main game state
  const frogInitial: Frog = {id : "frogger", y: Constants.FrogInitialY, x: Constants.FrogInitialX, w: Constants.FrogWidth, h: Constants.FrogHeight, alive: true}
  const r1ObsInitial: log = {id: "r1Obs", y: 60, x: -Constants.ObstacleWidth, w: Constants.ObstacleWidth, h: Constants.ObstacleHeight, speed: Constants.ObstacleSpeedLeft}
  const r2ObsInitial: log = {id: "r2Obs", y: 120, x: 600, w: Constants.ObstacleWidth, h: Constants.ObstacleHeight, speed: Constants.ObstacleSpeedRight}
  const r3ObsInitial: log = {id: "r3Obs", y: 180, x: -Constants.ObstacleWidth, w: Constants.ObstacleWidth, h: Constants.ObstacleHeight, speed: Constants.ObstacleSpeedLeft}
  const r4ObsInitial: car = {id: "r4Obs", y: 360, x: 600, w: Constants.ObstacleWidth, h: Constants.ObstacleHeight, speed: Constants.ObstacleSpeedRight}
  const r5ObsInitial: car = {id: "r5Obs", y: 420, x: -Constants.ObstacleWidth, w: Constants.ObstacleWidth, h: Constants.ObstacleHeight, speed: Constants.ObstacleSpeedLeft}
  const r6ObsInitial: car = {id: "r6Obs", y: 480, x: 600, w: Constants.ObstacleWidth, h: Constants.ObstacleHeight, speed: Constants.ObstacleSpeedRight}
  const initialGame: State = {Frog: frogInitial, r1: r1ObsInitial, r2: r2ObsInitial, r3: r3ObsInitial, r4: r4ObsInitial, r5: r5ObsInitial, r6: r6ObsInitial, gameOver: false, score: Constants.InitialScore, highscore: Constants.InitialScore }

  //The general movement for obstacle(both log and car)
  const obsMovement = (s:State): State =>{
    const l1 = s.r1
    const l2 = s.r2
    const l3 = s.r3
    const c1 = s.r4
    const c2 = s.r5
    const c3 = s.r6
    return {...s, r1:{...l1, x: l1.x+l1.speed},
    r2:{...l2, x: l2.x+l2.speed},
    r3:{...l3, x: l3.x+l3.speed},
    r4:{...c1, x: c1.x+c1.speed},
    r5:{...c2, x: c2.x+c2.speed},
    r6:{...c3, x: c3.x+c3.speed}}
  }

  // reset the obstacle position when it is out of canvas
  const refreshObs = (s: State): State => {
    const l1 = s.r1
    const l2 = s.r2
    const l3 = s.r3
    const c1 = s.r4
    const c2 = s.r5
    const c3 = s.r6
    return {...s, r1: l1.x>=600? r1ObsInitial:{...l1},
    r2: l2.x + l2.w<=0? r2ObsInitial:{...l2},
    r3: l1.x>=600? r3ObsInitial:{...l3},
    r4: c1.x + c1.w<=0? r4ObsInitial:{...c1},
    r5: c2.x>=600? r5ObsInitial:{...c2},
    r6: c3.x + c3.w<=0? r6ObsInitial:{...c3}
  }
  }
  
  // check for collision with the car and river
  // check if the frog is on the log
  // the frog will follow the log if it is on the log
  // if collision occurs then reset the frog position
  const checkFrog = (s: State): State =>{
    const f = s.Frog
    const l1 = s.r1
    const l2 = s.r2
    const l3 = s.r3
    const c1 = s.r4
    const c2 = s.r5
    const c3 = s.r6

    const onRiver = f.y < 240 && f.y >= 60? true : false
    const onLog = (f.y === l1.y && f.x + f.w >= l1.x && f.x <= l1.x+l1.w) ||
                  (f.y === l2.y && f.x + f.w >= l2.x && f.x <= l2.x+l2.w) ||
                  (f.y === l3.y && f.x + f.w >= l3.x && f.x <= l3.x+l3.w)?
                  true:false
    
    const collide = (f.y === c1.y && f.x + f.w >= c1.x && f.x <= c1.x+c1.w) ||
                    (f.y === c2.y && f.x + f.w >= c2.x && f.x <= c2.x+c2.w) ||
                    (f.y === c3.y && f.x + f.w >= c3.x && f.x <= c3.x+c3.w)?
                    true:false
                  
    return {...s, Frog:{...f, x:onLog? f.y === l1.y? l1.x : f.y === l2.y? l2.x: l3.x : f.x
      , alive: (onRiver && onLog) || (!onRiver && !collide)? true:false}}
  }

  // if the frog reach the opposite site player will score 1000
  // the difficulty increases everytime player scores
  // if frog has not reached the opposite site return current state
  const scoring = (s:State): State =>{
    const f = s.Frog
    const i = initialGame
    const l1 = s.r1
    const l2 = s.r2
    const l3 = s.r3
    const c1 = s.r4
    const c2 = s.r5
    const c3 = s.r6
    
    
    return f.y===0?{...i, 
    r1: {...l1, speed: l1.speed + 0.5},
    r2: {...l2, speed: l2.speed + 0.5},
    r3: {...l3, speed: l3.speed + 0.5},
    r4: {...c1, speed: c1.speed + 0.5},
    r5: {...c2, speed: c2.speed + 0.5},
    r6: {...c3, speed: c3.speed + 0.5}, 
    score: s.score + 1000}
    : {...s}
  }

  // If the frog is dead then make game over true in order to reset
  const checkGame = (s: State):State => {
    const f = s.Frog
    return f.alive? {...s} : {...s, gameOver: true} 
  }

  // change the state to initial while tracking the highscore
  const doReset = (s:State): State => {
    return s.gameOver? {...initialGame, highscore: s.score >= s.highscore? s.score:s.highscore}: {...s}
  }

  // read the keyboard event
  // only recognise 4 type of keys
  // map the observable into Move object
  type Key = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
  const keyObservable = (k:Key, result:()=>Move)=>
    fromEvent<KeyboardEvent>(document, 'keydown')
        .pipe(
          filter(({key})=>key === k),
          map(result)),

    up$ = keyObservable('ArrowUp', () => new Move(0 , -60)),
    down$ = keyObservable('ArrowDown', () => new Move(0 , 60)),
    left$ = keyObservable('ArrowLeft', () => new Move(-60 , 0)),
    right$ = keyObservable('ArrowRight', () => new Move(60 , 0));

  // takes in a state and computes all required actions
  // if desired keyboard event is detected, move object will be created
  // and the frog position will be updated
  // added constraints to prevent frog from jumping out of the canvas
  const reduceState = (s: State, m: Move): State => {
    const f = s.Frog
    return m instanceof Move?
    {...s, Frog:{...f, x: m.x >0? f.x + m.x >= Constants.CanvasWidth ?f.x : f.x + m.x: f.x <= 0? f.x : f.x+m.x, 
    y: m.y >0? f.y + m.y >= Constants.CanvasWidth ?f.y : f.y + m.y: f.y <= 0? f.y : f.y+m.y}} :
    (checkGame(obsMovement(refreshObs(scoring(checkFrog(doReset({...s})))))))
  }

  // where we update all the HTML elements' values
  // Only function that is impure and side effects are allowed here.
  // They will be contained within a subscription
  // return nothing
  function updateGame(s: State): void{

    const f = s.Frog
    const l1 = s.r1
    const l2 = s.r2
    const l3 = s.r3
    const c1 = s.r4   
    const c2 = s.r5    
    const c3 = s.r6
    
    const frogSVG = document.getElementById("frogger")!,
          r1SVG = document.getElementById(l1.id)!,
          r2SVG = document.getElementById(l2.id)!,
          r3SVG = document.getElementById(l3.id)!,
          r4SVG = document.getElementById(c1.id)!,
          r5SVG = document.getElementById(c2.id)!,
          r6SVG = document.getElementById(c3.id)!,
          scoreSVG = document.getElementById("score")!,
          highScore = document.getElementById("highScore")!;

    r1SVG.setAttribute("x", String(l1.x))
    r2SVG.setAttribute("x", String(l2.x))
    r3SVG.setAttribute("x", String(l3.x))
    r4SVG.setAttribute("x", String(c1.x))
    r5SVG.setAttribute("x", String(c2.x))
    r6SVG.setAttribute("x", String(c3.x))

    frogSVG.setAttribute("x", String(f.x))
    frogSVG.setAttribute("y", String(f.y))

    scoreSVG.textContent = "Score: " + s.score
    highScore.textContent = "High score: " + s.highscore

    // add highlight to the log if the frog is on the log
    if(f.y == l1.y){
      r1SVG.setAttribute("fill", "#39ff14")
      r2SVG.setAttribute("fill", "#808000")
      r3SVG.setAttribute("fill", "#808000")
    } else if (f.y == l2.y){
      r2SVG.setAttribute("fill", "#39ff14")
      r1SVG.setAttribute("fill", "#808000")
      r3SVG.setAttribute("fill", "#808000")
    } else if (f.y == l3.y){
      r1SVG.setAttribute("fill", "#808000")
      r2SVG.setAttribute("fill", "#808000")
      r3SVG.setAttribute("fill", "#39ff14")
    } else{
      r1SVG.setAttribute("fill", "#808000")
      r2SVG.setAttribute("fill", "#808000")
      r3SVG.setAttribute("fill", "#808000")
    }

  }
 
  // main stream for the frogger to be loaded
  // Merges desired keyboard events and uses scan to accumulate the state
  // lastly, pass in to updateGame to update all corresponding HTML elements
  const game = interval(10).pipe(merge(up$, down$, left$, right$),
  scan(reduceState , initialGame)
  ).subscribe(updateGame);
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
