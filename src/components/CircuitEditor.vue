<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import BaseComponent from './BaseComponent.vue';

const GRID_CELL_SIZE = 50;
const LARGE_GRID_CELL_SIZE = 200;
const MOUSE_TOOLS = ["default", "pointer", "crosshair"];

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

let NEXT_COMPONENT_ID = 0;
let CURRENT_UPDATE_COUNT = 0;

export default {
    data() {
        return {
            width: 600,
            height: 600,

            dragging: false,
            draggingPrevious: {x: 0, y: 0},
            mouseToolIndex: 0,

            camera: {x: 0.0, y: 0.0},
            zoom: 1.0,
            zoomFactor: 1.2,
            zoomTarget: 1.0,
            zoomPosition: {x: 0, y: 0},
            zoomInterval: null,
            dragOnCooldown: false,
            cumulativeMovement: {x: 0, y: 0},

            baseComponentsData: [],
            temporaryComponent: null,
            wires: [],

            updateInterval: null,

            worldMousePosition : {x: 0, y: 0},
            selectedOutput : null,

            currentPath: [],

            keysPressed: {},

            showTrashBin: false,
        };
    },
    methods: {
        setDimensions(width, height) {
            this.width = width;
            this.height = height;

            this.$nextTick(() => {
                this.alteredCamera();
            });
        },
        getColumns() {
            const cellSize = this.zoom < 0.66 ? LARGE_GRID_CELL_SIZE : GRID_CELL_SIZE;

            const worldLeft = this.camera.x;
            const worldRight = this.camera.x + this.width / this.zoom;
            const startX = Math.floor(worldLeft / cellSize) * cellSize;
            const endX = Math.ceil(worldRight / cellSize) * cellSize;

            let columns = [];
            for (let x = startX; x <= endX; x += cellSize) {
                columns.push({
                    top: 0,
                    left: (x - this.camera.x) * this.zoom - 1,
                    width: 2,
                    height: this.height
                });
            }
            return columns;
        },
        getRows() {
            const cellSize = this.zoom < 0.66 ? LARGE_GRID_CELL_SIZE : GRID_CELL_SIZE;

            const worldTop = this.camera.y;
            const worldBottom = this.camera.y + this.height / this.zoom;
            const startY = Math.floor(worldTop / cellSize) * cellSize;
            const endY = Math.ceil(worldBottom / cellSize) * cellSize;

            let rows = [];
            for (let y = startY; y <= endY; y += cellSize) {
                rows.push({
                    top: (y - this.camera.y) * this.zoom - 1,
                    left: 0,
                    width: this.width,
                    height: 2
                });
            }
            return rows;
        },
        startDragMousedown(event) {
            if (event.button == 2) return;
            if ((this.getMouseTool() === 'default' || this.getMouseTool() === 'crosshair') && event.button != 1) return;

            this.startDrag();
            window.addEventListener("mouseup", this.stopDrag);
        },
        handleKeydown(event) {
            this.keysPressed[event.key] = true;

            if (this.keysPressed['Control']) {
                this.controlKey(event.key);
                return;
            }

            if (event.key === ' ') {
                this.startDragKeydown();
            }
            else if (event.key === 'Escape' || event.key === 'z') {
                this.temporaryComponent = null;
                this.setMouseTool(0);
                this.cancelPath();
            }
            else if (event.key === 'x') {
                this.setMouseTool(1);
                this.cancelPath();
            }
            else if (event.key === 'c') {
                this.setMouseTool(2);
                this.cancelPath();
            }
            else if (event.key === '0') {
                this.zoomTarget = 1.0;
                this.zoomPosition = {
                    x: this.width / 2,
                    y: this.height / 2,
                }
                this.startZoom();
            }
            else if (event.key === '1') {
                this.zoomTarget = MAX_ZOOM;
                this.zoomPosition = {
                    x: this.width / 2,
                    y: this.height / 2,
                }
                this.startZoom();
            }
            else if (event.key === '2') {
                this.zoomTarget = MIN_ZOOM;
                this.zoomPosition = {
                    x: this.width / 2,
                    y: this.height / 2,
                }
                this.startZoom();
            }
        },
        handleKeyup(event) {
            this.keysPressed[event.key] = false;
        },
        controlKey(key) {

        },
        startDragKeydown() { 
            this.startDrag();
            window.addEventListener("keyup", event => {if (event.key !== ' ') return; this.stopDrag()});
        },
        startDrag() {
            document.body.style.cursor = "move";

            this.dragging = true;
            window.addEventListener("mousemove", this.drag);
        },
        drag(event) {
            if (!this.dragging) return;
            
            this.cumulativeMovement.x += event.movementX;
            this.cumulativeMovement.y += event.movementY;
            
            if (this.dragOnCooldown) {
                return;
            }
            this.dragOnCooldown = true;
            setTimeout(() => {this.dragOnCooldown = false}, 5);

            this.camera.x -= this.cumulativeMovement.x / this.zoom;
            this.camera.y -= this.cumulativeMovement.y / this.zoom;

            this.cumulativeMovement.x = 0;
            this.cumulativeMovement.y = 0;

            this.alteredCamera();
        },
        stopDrag() {
            document.body.style.cursor = this.getMouseTool();

            this.dragging = false;
            window.removeEventListener("mousemove", this.drag);
            window.removeEventListener("mouseup", this.stopDrag);
        },
        startZoom() {
            if (this.zoomInterval) {
                clearInterval(this.zoomInterval);
            }
            this.zoomInterval = setInterval(this.applyZoom, 5);
        },
        endZoom() {
            clearInterval(this.zoomInterval);
        },
        lerp(a, b, t) {
            return a * (1 - t) + b * t;
        },
        applyZoom() {
            if (Math.abs(this.zoomTarget - this.zoom) < 0.01) {
                this.endZoom();
                return;
            }

            const zoomFactor = this.lerp(this.zoom, this.zoomTarget, 0.1) / this.zoom;

            const worldX = this.camera.x + this.zoomPosition.x / this.zoom;
            const worldY = this.camera.y + this.zoomPosition.y / this.zoom;

            this.zoom *= zoomFactor;

            this.camera.x = worldX - this.zoomPosition.x / this.zoom;
            this.camera.y = worldY - this.zoomPosition.y / this.zoom;

            this.alteredCamera();
        },
        zoomIn() {
            if (this.zoomTarget >= MAX_ZOOM) return;
            this.zoomTarget *= this.zoomFactor;
            this.zoomPosition = {
                x: this.width / 2,
                y: this.height / 2,
            }
            this.startZoom();
        },
        zoomOut() {
            if (this.zoomTarget <= MIN_ZOOM) return;
            this.zoomTarget /= this.zoomFactor;
            this.zoomPosition = {
                x: this.width / 2,
                y: this.height / 2,
            }
            this.startZoom();
        },
        resetZoom() {
            this.zoomTarget = 1;
            this.zoomPosition = {
                x: this.width / 2,
                y: this.height / 2,
            }
            this.startZoom();
        },
        handleMouseWheel(event) {
            this.zoomPosition.x = event.clientX;
            this.zoomPosition.y = event.clientY;

            const zoomSensitivity = 0.002;
            const zoomChange = 1 - (event.deltaY * zoomSensitivity);

            const newZoomTarget = this.zoomTarget * zoomChange;
            this.zoomTarget = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoomTarget));

            this.startZoom();
        },
        newBaseComponent(behavior, position, width, height) {
            let component = {
                id: NEXT_COMPONENT_ID,
                behavior: behavior,
                position: position,
                width: width,
                height: height,
                pins: {
                    inputs: [],
                    outputs: [],
                },
            };

            NEXT_COMPONENT_ID += 1;

            return component;
        },
        newEmptyComponent(position, width, height) {
            return this.newBaseComponent({}, position, width, height);
        },
        addEmptyComponent(position, width, height) {
            this.baseComponentsData.push(this.newBaseComponent({}, position, width, height));
        },
        parseRender(libRender, behavior) {
            let newRender = {
                type: libRender.type
            };

            if (libRender.type === "DEFAULT") {
                newRender.text = behavior.name;
                newRender.start = (component, render, baseComponent) => {
                    baseComponent.text = render.text;
                }
            }
            else if (libRender.type === "TEXT") {
                newRender.text = libRender.text;
                newRender.start = (component, render, baseComponent) => {
                    baseComponent.text = render.text;
                }
            }
            else if (libRender.type === "COLOR") {
                newRender.color = libRender.color;
                newRender.start = (component, render, baseComponent) => {
                    baseComponent.color = render.color;
                }
            }
            else if (libRender.type === "CONDITIONAL") {
                if (libRender.condition.type === "STATE") {
                    const stateKey = libRender.condition.key;
                    newRender.conditionFunction = (component) => {
                        return component.behavior.state[stateKey];
                    };
                }
                else if (libRender.condition.type === "INPUT") {
                    const inputIndex = libRender.condition.pin;
                    newRender.conditionFunction = (component) => {
                        return component.pins.inputs[inputIndex].state;
                    };
                }

                newRender.renderTrue = this.parseRender(libRender.renderTrue, behavior);
                newRender.renderFalse = this.parseRender(libRender.renderFalse, behavior);

                newRender.start = (component, render, baseComponent) => {
                    if (render.conditionFunction(component)) {
                        render.renderTrue.start(component, render.renderTrue, baseComponent);
                    }
                    else {
                        render.renderFalse.start(component, render.renderFalse, baseComponent);
                    }
                };
            }
            else if (libRender.type === "MULTIPLE") {
                newRender.subRenders = [];
                libRender.subRenders.forEach(subRender => {
                    newRender.subRenders.push(this.parseRender(subRender, behavior));
                });

                newRender.start = (component, render, baseComponent) => {
                    render.subRenders.forEach(subRender => {
                        subRender.start(component, subRender, baseComponent);
                    });
                };
            }

            return newRender;
        },
        parseResultEvaluations(libResultEvaluations, behavior) {
            let evalFunctions = [];
            libResultEvaluations.forEach(resEval => {
                if (resEval.type === "TABLE") {
                    evalFunctions.push((behavior, inputValues) => {
                        const l = inputValues.length;
                        let index = 0;
                        for (let i = 0; i < l; i++) {
                            if (!inputValues[i]) continue;
                            index += Math.pow(2, l - i - 1);
                        }

                        return resEval.table[index];
                    });
                }
                else if (resEval.type === "NONE") {
                    evalFunctions.push((behavior, inputValues) => {});
                }
                else if (resEval.type === "STATE") {
                    behavior.state[resEval.key] = false;
                    evalFunctions.push((behavior, inputValues) => {
                        return behavior.state[resEval.key];
                    });
                }
                else if (resEval.type === "CIRCUIT") {
                    evalFunctions.push((behavior, inputValues, updateCount) => {
                        if (updateCount > behavior.circuit.lastUpdated) {
                            behavior.circuit.lastUpdated = updateCount;

                            behavior.circuit.inputReferences.forEach((circuitInput, index) => {
                                circuitInput.behavior.state["value"] = inputValues[index];
                            });

                            behavior.circuit.components.forEach(component => {
                                component.pins.inputs.forEach(inputPin => {
                                    if (inputPin.source) inputPin.state = inputPin.source.state;
                                });

                                let inputValues = [];
                                component.pins.inputs.forEach((inputPin) => {
                                    inputValues.push(inputPin.state);
                                });
                                component.pins.outputs.forEach((outputPin, index) => {
                                    outputPin.state = component.behavior.resultFunctions[index](component.behavior, inputValues, updateCount);
                                });
                            });
                        }
                        
                        return behavior.circuit.outputReferences[resEval.pin].pins.inputs[0].state;
                    });
                }
                else {
                    console.error("Unknown result evalutation type : " + resEval.type);
                    evalFunctions.push((behavior, inputValues) => {});
                }
            });
            
            return evalFunctions;
        },
        parseCircuit(circuitBlueprint, behavior) {
            circuitBlueprint.instances.sort((instanceA, instanceB) => {
                return instanceA.id - instanceB.id;
            })

            behavior.circuit = {
                lastUpdated: 0,
                components: [],
                inputReferences: [],
                outputReferences: [],
                wires: []
            }

            const idMap = {}

            circuitBlueprint.instances.forEach(instance => {
                const newComponent = this.newLibraryComponent(instance.libraryId, instance.name, instance.position);
                behavior.circuit.components.push(newComponent);
                idMap[instance.id] = newComponent;
                if (newComponent.behavior.libraryId == 2) {
                    if (newComponent.behavior.name === "IN") {
                        behavior.circuit.inputReferences.push(newComponent);
                    }
                    else if (newComponent.behavior.name === "OUT") {
                        behavior.circuit.outputReferences.push(newComponent);
                    }
                }
            });

            circuitBlueprint.connections.forEach(connection => {
                const sourceComp = idMap[connection.sourceId];
                const destComp = idMap[connection.destId];

                destComp.pins.inputs[connection.destIndex].source = sourceComp.pins.outputs[connection.sourceIndex];

                let wire = {
                    sourceId: sourceComp.id,
                    sourceIndex: connection.sourceIndex,
                    destId: destComp.id,
                    destIndex: connection.destIndex,
                    path: connection.path,
                };

                behavior.circuit.wires.push(wire);
            });
        },
        newLibraryComponent(libraryId, componentName, position) {
            let behavior = {
                state: {},
                onPoke: (b) => {}
            };
            let libraryComponent = this.$parent.getLibraryComponent(libraryId, componentName);

            behavior.inputs = libraryComponent.inputs;
            behavior.outputs = libraryComponent.outputs;
            behavior.name = libraryComponent.name;
            behavior.libraryId = libraryId;
            behavior.defaultColor = libraryComponent.color;
            behavior.defaultBorderColor = libraryComponent.borderColor;

            if (libraryComponent.circuit) {
                this.parseCircuit(libraryComponent.circuit, behavior);
            }

            behavior.resultFunctions = this.parseResultEvaluations(libraryComponent.resultEvaluations, behavior);

            const interaction = libraryComponent.interaction;
            if (interaction) {
                let actionFunction;
                if (interaction.action.type === "TOGGLE") {
                    actionFunction = (behavior) => {
                        behavior.state[interaction.action.key] = !behavior.state[interaction.action.key];
                    }
                }

                if (interaction.type === "POKE") {
                    behavior.onPoke = actionFunction;
                }
            }

            behavior.render = this.parseRender(libraryComponent.render, behavior);

            let component = this.newBaseComponent(behavior, position, libraryComponent.dimensions.width, libraryComponent.dimensions.height);

            for (let i = 0; i < behavior.inputs; i++) {
                this.addComponentPin(component, "INPUT");
            }
            for (let i = 0; i < behavior.outputs; i++) {
                this.addComponentPin(component, "OUTPUT");
            }

            return component;
        },
        addLibraryComponent(libraryId, componentName, position) {
            this.baseComponentsData.push(this.newLibraryComponent(libraryId, componentName, position));
        },
        setTemporaryComponent(libraryId, componentName) {
            this.temporaryComponent = this.newLibraryComponent(libraryId, componentName, {x: 0, y: 0});
            this.temporaryComponent.temporary = true;
        },
        placeTemporaryComponent() {
            if (this.temporaryComponent) {
                this.temporaryComponent.temporary = null;
                this.baseComponentsData.push(this.temporaryComponent);
                this.temporaryComponent = null;

                if (this.keysPressed['Shift']) {
                    const last = this.baseComponentsData[this.baseComponentsData.length - 1];
                    this.setTemporaryComponent(last.behavior.libraryId, last.behavior.name);
                }

                this.$nextTick(() => {this.alteredCamera()});
            }
        },
        findComponentById(componentId) {
            return this.baseComponentsData.find(comp => {
                return comp.id == componentId;
            });
        },
        removeComponentById(componentId) {
            this.baseComponentsData = this.baseComponentsData.filter(component => {
                return component.id != componentId;
            });

            this.wires = this.wires.filter(wire => {
                return wire.sourceId != componentId && wire.destId != componentId;
            });

            this.$nextTick(() => {
                this.alteredCamera();
            });
        },
        addComponentPin(component, pinType) {
            let pin = {
                type: pinType,
                state: false,
                parentId: component.id,
                wires: {
                    incoming: null,
                    outgoing: []
                },
            };

            if (pinType === "OUTPUT") {
                pin.index = component.pins.outputs.length;
                component.pins.outputs.push(pin);
            }
            else {
                pin.index = component.pins.inputs.length;
                component.pins.inputs.push(pin);
            }
        },
        addComponentPinById(componentId, pinType) {
            let component = this.findComponentById(componentId);

            let pin = {
                type: pinType,
                state: false,
                parentId: componentId,
                wires: {
                    incoming: null,
                    outgoing: []
                },
            };

            if (pinType === "OUTPUT") {
                pin.index = component.pins.outputs.length;
                component.pins.outputs.push(pin);
            }
            else {
                pin.index = component.pins.inputs.length;
                component.pins.inputs.push(pin);
            }
        },
        cancelPath() {
            this.currentPath = [];
            this.selectedOutput = null;
        },
        clickBackground(event) {
            if (this.temporaryComponent) {
                this.placeTemporaryComponent();
                return;
            }

            if (!this.selectedOutput) {
                return;
            }

            if (event.shiftKey) {
                
                const clickPosition = {x: event.clientX, y: event.clientY};

                const sourceVueComp = this.findComponentById(this.selectedOutput.parentId).vueComponent;
                const start = sourceVueComp.getOutputPinPosition(this.selectedOutput.index);
                const lastKnown = this.currentPath[0] ? this.currentPath[this.currentPath.length - 1] : start;

                const placePosition = this.projectOnAxes(lastKnown, this.screenToWorldCoordinates(clickPosition));

                this.currentPath.push(placePosition);
            }
            else {
                this.currentPath = [];
                this.selectedOutput = null;
            }
        },
        arePinsIdentical(pin1, pin2) {
            return pin1.type === pin2.type && pin1.parentId == pin2.parentId && pin1.index == pin2.index;
        },
        isPinSelected(pin) {
            if (!this.selectedOutput) return false;
            return this.arePinsIdentical(this.selectedOutput, pin);
        },
        handlePinClick(pin) {
            if (this.getMouseTool() !== "crosshair") return;

            if (this.selectedOutput) {
                if (pin.type === "INPUT") {
                    if (pin.source) {
                        this.removeWire(pin.parentId, pin.index);
                        if (this.arePinsIdentical(this.selectedOutput, pin.source)) {
                            pin.source = null;
                            this.currentPath = [];
                            this.selectedOutput = null;
                            return;
                        }
                    }

                    if (this.currentPath[0]) {
                        const pinPosition = this.findComponentById(pin.parentId).vueComponent.getInputPinPosition(pin.index);
                        this.currentPath[this.currentPath.length - 1] = this.projectOnAxes(pinPosition, this.currentPath[this.currentPath.length - 1]);
                    }

                    this.connectPins(this.selectedOutput.parentId, this.selectedOutput.index, pin.parentId, pin.index, this.currentPath);
                    this.currentPath = [];
                    this.selectedOutput = null;
                }
                else { // TYPE = OUTPUT
                    this.selectedOutput = pin;
                }
            }
            else { // NO SELECTED OUTPUT PIN
                if (pin.type === "INPUT") {
                    return;
                }
                else { // TYPE = OUTPUT
                    this.selectedOutput = pin;
                }
            }
        },
        removeWire(destId, destIndex) {
            this.wires = this.wires.filter(wire => {
                return !(wire.destId == destId && wire.destIndex == destIndex);
            });
        },
        connectPins(sourceId, sourceIndex, destId, destIndex, path) {
            let sourceComp = this.findComponentById(sourceId);
            let source = sourceComp.pins.outputs[sourceIndex];

            let destComp = this.findComponentById(destId);
            let dest = destComp.pins.inputs[destIndex];

            dest.source = source;

            let wire = {
                sourceId: sourceId,
                sourceIndex: sourceIndex,
                destId: destId,
                destIndex: destIndex,
                path: path,
            }

            this.wires.push(wire);
        },
        getComponentsByName(circuitName) {
            return this.baseComponentsData.filter(comp => {return comp.behavior.name === circuitName});
        },
        countComponentsByName(circuitName) {
            return this.getComponentsByName(circuitName).length;
        },
        alteredCamera() {
            this.updateComponentPositions();
            this.updateCanvas();
        },
        updateComponentPositions() {
            if (this.temporaryComponent) this.$refs.tempBaseComponent.moveWithCamera(this.camera, this.zoom, this.width, this.height);

            if (!this.$refs.baseComponents) return;

            this.$refs.baseComponents.forEach(component => {
                component.moveWithCamera(this.camera, this.zoom, this.width, this.height);
            });
        },
        updateCanvas() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext("2d");

            this.drawBackground(canvas, ctx);
            this.drawWires(canvas, ctx);
        },
        drawBackground(canvas, ctx) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = "darkslategray";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = this.zoom > 0.66 ? "lightslategray" : "rgb(95, 108, 122)";

            const columns = this.getColumns();
            columns.forEach(col => {
                ctx.fillRect(col.left, col.top, col.width, col.height);
            });

            const rows = this.getRows();
            rows.forEach(row => {
                ctx.fillRect(row.left, row.top, row.width, row.height);
            });
        },
        drawWires(canvas, ctx) {
            ctx.globalAlpha = 1;
            ctx.lineWidth = this.scaleToZoom(3);
            this.wires.forEach(wire => {
                const sourceComp = this.findComponentById(wire.sourceId);
                ctx.strokeStyle = sourceComp.pins.outputs[wire.sourceIndex].state ? 'crimson' : 'rgb(80, 9, 23)';

                const sourceVueComp = sourceComp.vueComponent;
                const destVueComp = this.findComponentById(wire.destId).vueComponent;

                const start = this.worldToScreenCoordinates(sourceVueComp.getOutputPinPosition(wire.sourceIndex));
                const end = this.worldToScreenCoordinates(destVueComp.getInputPinPosition(wire.destIndex));

                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                wire.path.map(point => {return this.worldToScreenCoordinates(point)}).forEach(point => {ctx.lineTo(point.x, point.y)});
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            });

            if (this.selectedOutput) {
                this.drawCurrentPath(canvas, ctx);
            }
        },
        drawCurrentPath(canvas, ctx) {
            ctx.strokeStyle = this.selectedOutput.state ? 'crimson' : 'rgb(80, 9, 23)';
            ctx.globalAlpha = 0.5;
            
            const sourceVueComp = this.findComponentById(this.selectedOutput.parentId).vueComponent;
            const start = this.worldToScreenCoordinates(sourceVueComp.getOutputPinPosition(this.selectedOutput.index));
            
            let pointerPosition = this.worldMousePosition;

            const hoveredPinElement = document.querySelector('.input:hover');
            if (hoveredPinElement) {
                const rect = hoveredPinElement.getBoundingClientRect();
                pointerPosition = this.screenToWorldCoordinates({x: rect.left + rect.width / 2, y: rect.top + rect.height / 2});

                if (this.currentPath[0]) {
                    this.currentPath[this.currentPath.length - 1].y = pointerPosition.y;
                }
            }

            const lastKnown = this.currentPath[0] ? this.currentPath[this.currentPath.length - 1] : this.screenToWorldCoordinates(start);
            const end = this.worldToScreenCoordinates(this.keysPressed.Shift ? this.projectOnAxes(lastKnown, pointerPosition) : pointerPosition);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            this.currentPath.map(point => {return this.worldToScreenCoordinates(point)}).forEach(point => {ctx.lineTo(point.x, point.y)});
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        },
        worldToScreenCoordinates(coordinates) {
            return {
                x: (coordinates.x - this.camera.x) * this.zoom,
                y: (coordinates.y - this.camera.y) * this.zoom,
            }
        },
        screenToWorldCoordinates(coordinates) {
            return {
                x: coordinates.x / this.zoom + this.camera.x,
                y: coordinates.y / this.zoom + this.camera.y,
            }
        },
        projectOnAxes(origin, point) {
            const deltaX = Math.abs(origin.x - point.x);
            const deltaY = Math.abs(origin.y - point.y);

            if (deltaX > deltaY) {
                return {x: point.x, y: origin.y};
            }
            else {
                return {x: origin.x, y: point.y};
            }
        },
        snapToGrid(position, offset, snapResolution) {
            if (!snapResolution) snapResolution = 50;
            if (!offset) offset = {x: 0, y: 0};

            const offsetPosition = {x: position.x + offset.x, y: position.y + offset.y};

            return {
                x: offsetPosition.x - ((offsetPosition.x % snapResolution) + snapResolution) % snapResolution,
                y: offsetPosition.y - ((offsetPosition.y % snapResolution) + snapResolution) % snapResolution
            };
        },
        componentPickedUp(component) {
            this.showTrashBin = true;
        },
        componentPlacedDown(component) {
            this.showTrashBin = false;

            if (this.isMouseInTrashBin()) {
                this.removeComponentById(component.id);
            }
        },
        isBoxInBounds(screenPosition, screenWidth, screenHeight) {
            return !(screenPosition.x > this.width
                || screenPosition.x + screenWidth < 0
                || screenPosition.y > this.height
                || screenPosition.y + screenHeight < 0);
        },
        isPointInBox(point, origin, width, height) {
            return point.x >= origin.x &&
                point.x <= origin.x + width &&
                point.y >= origin.y &&
                point.y <= origin.y + height;
        },
        isMouseInTrashBin() {
            if (!this.$refs.trash) return false;

            const rect = this.$refs.trash.getBoundingClientRect();
            return this.isPointInBox(this.worldToScreenCoordinates(this.worldMousePosition), {x: rect.left, y: rect.top}, rect.width, rect.height);
        },
        scaleToZoom(property) {
            return property * this.zoom;
        },
        getMouseTool() {
            return MOUSE_TOOLS[this.mouseToolIndex];
        },
        cycleMouseTools() {
            this.mouseToolIndex = (this.mouseToolIndex + 1) % MOUSE_TOOLS.length;
            document.body.style.cursor = this.getMouseTool();
        },
        setMouseTool(index) {
            this.mouseToolIndex = index;
            document.body.style.cursor = this.getMouseTool();
        },
        onLibrariesLoaded() {
            this.$nextTick(() => {
                this.updateInterval = setInterval(() => {this.updateComponents(CURRENT_UPDATE_COUNT); CURRENT_UPDATE_COUNT += 1}, 10);

                this.alteredCamera();
                this.$nextTick(() => {
                    this.alteredCamera();
                })
            });
        },
        updateComponents(updateCount) {
            if (!this.$refs.baseComponents) return;
            this.$refs.baseComponents.forEach(baseComponent => {
                baseComponent.updateLogic(updateCount);
            });
            this.updateCanvas();
        },
        mouseMove(event) {
            this.worldMousePosition = this.screenToWorldCoordinates({x: event.clientX, y: event.clientY});
            if (this.temporaryComponent) {
                this.temporaryComponent.position = {
                    x: this.worldMousePosition.x - this.temporaryComponent.width / 2,
                    y: this.worldMousePosition.y - this.temporaryComponent.height / 2
                };
                this.$refs.tempBaseComponent.moveWithCamera(this.camera, this.zoom, this.width, this.height);
            }
        },
        // Helper function made using ChatGPT
        lightenColor(color, amount = 20) {
            const clamp = (val) => Math.max(0, Math.min(255, val));

            function hexToRgb(hex) {
                hex = hex.replace(/^#/, '');
                if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
                }
                const bigint = parseInt(hex, 16);
                return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255
                };
            }

            function rgbStringToRgb(rgbStr) {
                const result = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
                return result ? {
                r: parseInt(result[1]),
                g: parseInt(result[2]),
                b: parseInt(result[3])
                } : null;
            }

            function rgbToHex(r, g, b) {
                return (
                '#' +
                [r, g, b]
                    .map((x) => clamp(x).toString(16).padStart(2, '0'))
                    .join('')
                );
            }

            let rgb;

            if (color.startsWith('#') && color.length == 7) {
                rgb = hexToRgb(color);
            } else if (color.startsWith('rgb(') && color.endsWith(')')) {
                rgb = rgbStringToRgb(color);
            } else {
                rgb = null;
            }

            if (!rgb) return null;

            const newR = clamp(rgb.r + amount);
            const newG = clamp(rgb.g + amount);
            const newB = clamp(rgb.b + amount);

            return rgbToHex(newR, newG, newB);
        },
        clearEditor() {
            this.baseComponentsData.length = 0;
            this.wires.length = 0;
        },
        openSavePopup(event) {
            const title = "Save Circuit";
            const mousePosition = this.worldToScreenCoordinates(this.worldMousePosition);

            this.$parent.closePopupsByTitle(title);

            this.$parent.addPopup({
                title: title,
                position: {x: mousePosition.x + 50, y: mousePosition.y + 50},
                data: {
                    name: "",
                    color: ""
                },
                contents: [
                    {
                        type: "INPUT",
                        key: "name",
                        placeholder: "Enter circuit name",
                        strictFormat: true
                    },
                    {
                        type: "INPUT",
                        key: "color",
                        placeholder: "Enter circuit color"
                    }
                ],
                options: [
                    {
                        color: "#6688FA",
                        name: "Save",
                        onClick: (popup, app) => {
                            if (popup.data.name.length > 0 && this.lightenColor(popup.data.color)) {
                                this.saveCurrentCircuit(popup.data.name, popup.data.color);
                            }
                            else {
                                if (popup.contents.length < 3) popup.contents.push({});
                                popup.contents[2] = {
                                    type: "TEXT",
                                    text: "Missing name or Invalid color format : use #12AB34 or rgb(12, AB, 34)"
                                }
                                return true;
                            }
                        }
                    },
                    {
                        color: "#FA5544",
                        name: "Cancel",
                        onClick: (popup, app) => {}
                    }
                ]
            });
        },
        saveCurrentCircuit(name, color) {
            console.log(`Saving circuit "${name}" with color ${color}...`);

            const inputs = this.getComponentsByName("IN");
            const outputs = this.getComponentsByName("OUT");

            const newLibraryComponent = {
                name: name,
                inputs: inputs.length,
                outputs: outputs.length,
                dimensions: {
                    width: (name.length / 3 + 0.5) * 50,
                    height: Math.max(50, (Math.max(inputs.length, outputs.length) / 2) * 50)
                },
                color: color,
                render: {
                    type: "DEFAULT"
                },
                resultEvaluations: outputs.map((pin, index) => {return {type: "CIRCUIT", pin: index}}),
                circuit: {
                    instances: this.baseComponentsData.map(component => {
                        return {
                            id: component.id,
                            libraryId: component.behavior.libraryId,
                            name: component.behavior.name,
                            position: {
                                x: component.position.x,
                                y: component.position.y
                            }
                        }
                    }),
                    connections: this.wires.map(wire => {
                        return {
                            sourceId: wire.sourceId,
                            sourceIndex: wire.sourceIndex,
                            destId: wire.destId,
                            destIndex: wire.destIndex,
                            path: wire.path.map(point => {
                                return {
                                    x: point.x,
                                    y: point.y
                                }
                            })
                        }
                    })
                }
            };

            console.log(newLibraryComponent);

            this.$parent.addProjectComponent(newLibraryComponent);
            this.clearEditor();
        },
    },
    emits: ['mounted'],
    mounted() {
        this.$nextTick(() => {
            window.addEventListener("keydown", this.handleKeydown);
            window.addEventListener("keyup", this.handleKeyup); 
            window.addEventListener("mousemove", this.mouseMove);
        });

        this.$emit("mounted");
        console.log("CircuitEditor Mounted");
    },
    components: {
        BaseComponent
    }
}
</script>

<template>
    <canvas class="background"
    :width="this.width"
    :height="this.height"
    @mousedown="this.startDragMousedown"
    @click="this.clickBackground"
    ref="canvas"
    >
    </canvas>

    <div id="zoom-buttons" :style="{'left':`${this.width/2}px`}">
        <button @mousedown="this.zoomIn">
            <font-awesome-icon :icon="['fas', 'magnifying-glass-plus']" />
        </button>
        <button @mousedown="this.zoomOut">
            <font-awesome-icon :icon="['fas', 'magnifying-glass-minus']" />
        </button>
        <button @mousedown="this.resetZoom">
            <font-awesome-icon :icon="['fas', 'rectangle-xmark']" />
        </button>
    </div>

    <div id="top-buttons" :style="{'left':`${this.width/2}px`}">
        <button @mousedown="this.cycleMouseTools">
            <font-awesome-icon :icon="['fas', 'arrow-pointer']" v-if="this.mouseToolIndex == 0"/>
            <font-awesome-icon :icon="['fas', 'hand-pointer']" v-else-if="this.mouseToolIndex == 1"/>
            <font-awesome-icon :icon="['fas', 'network-wired']" v-else-if="this.mouseToolIndex == 2"/>
        </button>
        <button @mousedown="this.openSavePopup">
            <font-awesome-icon :icon="['fas', 'floppy-disk']" />
        </button>
    </div>

    <div id="trash-bin"
        ref="trash"
        :class="[this.isMouseInTrashBin() ? 'trashing' : 'not-trashing']"
        :style="{
            'visibility':`${this.showTrashBin ? 'visible' : 'hidden'}`,
            'opacity':`${this.showTrashBin ? '100%' : '0%'}`,
        }"
    >
        DROP HERE TO DELETE
    </div>

    <BaseComponent
        v-for="component in this.baseComponentsData"
        :key="component.id"
        :componentData="component"
        ref="baseComponents"
    />

    <BaseComponent
        v-if="this.temporaryComponent"
        :componentData="this.temporaryComponent"
        :style="{
            'opacity': '50%'}"
        ref="tempBaseComponent"
    />
</template>

<style scoped>
.background {
    overflow: hidden;
}

#trash-bin {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 150px;
    height: 100px;
    background-color: rgba(200, 200, 200, 0.2);
    border-radius: 10px;
    font-weight: bold;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-style: dashed;
    border-width: 5px;
    transition: transform 0.2s, color 0.2s, visibility 0.2s, opacity 0.2s;
}

.not-trashing {
    color: lightslategray;
}

.trashing {
    transform: scale(1.1);
    color: crimson;
}

#zoom-buttons {
    position: absolute;
    bottom: 20px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    z-index: 10;
    width: fit-content;
    transform: translateX(-50%);
}

#top-buttons {
    position: absolute;
    top: 20px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    z-index: 10;
    width: fit-content;
    transform: translateX(-50%);
}

button {
    position: relative;
    width: 50px;
    margin: 10px;
    margin-bottom: 0;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 15px;
    padding-right: 15px;
    background-color: rgb(30, 50, 50);
    color: lightslategray;
}

*:focus {
    outline: none;
}
</style>