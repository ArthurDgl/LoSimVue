![losimvue](https://github.com/user-attachments/assets/800f7ec9-cd9a-476a-91c9-d065722bb456)
# Lo Sim Vue (Logic Simulator on Vue)
### (Work In Progress)

This is a web-based logic simulator inspired by Sebastian Lague's videos and my Electronics classes.\
First version was prototyped in p5js, this is the official one.

Current Progress (accessible at ~~http://dugnolle.fr:3000~~ :/ not right now) :
![image](https://github.com/user-attachments/assets/67d882d6-a655-4064-803b-1a0c814ba81a)


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

### Saving Components
To save current circuit into its own component :\
Press the **floppy disk** button at the **top of the screen**\
Then enter the necessary information and press **Save**\
**Pins** are ordered top down and their **labels** are shown

### Editing Properties
To edit a component's properties, **right-click** using the **pointer** tool\
Then click **Apply**

### Popups
Some actions trigger popups to give additional information or give choices

# Planned Features

### Edit existing components

### Start new wire from existing wire

### Edit wires

### Wires follow attached components

### Tooltips

### Multi-element select for move and delete

### Multi-bit pins and wires

### Mobile support

### Custom Libraries

### Basic VHDL Support

### Save Project

### SVG Component Rendering

### Canvas Rendering
