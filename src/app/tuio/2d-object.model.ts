import { TuioMessage } from './message.model';

/**
 * A TUIO Object Object (an Object Object? whaaat?)
 */
export class Tuio2DObject {
  sessionId: number;
  classId: number;
  xPosition: number;
  yPosition: number;
  aAngle: number;
  xVelocity: number;
  yVelocity: number;
  aRotationSpeed: number;
  motionAcceleration: number;
  rotationAccleration: number; // sic!

  constructor(message: TuioMessage) {
    this.sessionId = message.sessionId;
    this.classId = message.classId;
    this.xPosition = message.xPosition;
    this.yPosition = message.yPosition;
    this.aAngle = message.aAngle;
    this.xVelocity = message.xVelocity;
    this.yVelocity = message.yVelocity;
    this.motionAcceleration = message.motionAcceleration;
    this.rotationAccleration = message.rotationAccleration; // sic!
  }
}
