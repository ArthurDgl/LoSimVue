![losimvue](https://github.com/user-attachments/assets/800f7ec9-cd9a-476a-91c9-d065722bb456)
# Lo Sim Vue (Logic Simulator on Vue)
### (Work In Progress)

This is a web-based logic simulator inspired by Sebastian Lague's videos and my Electronics classes.\
First version was prototyped in p5js, this is the official one.

Current Progress (accessible at http://dugnolle.fr:3000) :
![image](https://github.com/user-attachments/assets/f066a351-77e4-489b-b162-aca0d377002d)


# Current Features

### Mouse Tools
Click the **tools button** at the top of the screen to cycle between tools (**default**, **poke**, **connect**)\
**Default** is for most editing tasks\
**Poke** is for user-circuit interaction\
**Connect** is for drawing wires

### Camera Movements
Pan using **middle mouse button** or **space bar**\
or **left mouse button** (only works while using **poking tool**)\
**Scroll** to zoom In and Out\
or use **zoom buttons** at the bottom of the screen (In, Out, Reset)

### Placing Components
Choose from the **Loaded Libraries** window (click once to pick up, once to place down)\
Placed components can be **dragged** when in **default mouse tool**\
Drag to **bottom corner** to **delete** (delete bin appears when a component is being dragged)

### Drawing Wires
While using the **connection mouse tool** :\
**Click** on the **source pin** to start a wire\
**Click** on the **destination pin** to make the connection\
**Holding Shift** while connecting makes **straight wires** (click to add intermediary nodes)\
New connections **overwrite** old ones\
Attempting to connect two pins that are **already connected** will **remove the current wire**


# Planned Features

### Save circuits into their own blocks

### Start new wire from existing wire

### Edit wires

### Wires follow attached components

### Popups and Tooltips

### Multi-element select for move and delete

### Mobile support

### Custom Libraries


