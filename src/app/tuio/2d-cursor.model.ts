import { TuioMessage } from './message.model';

/**
 * A TUIO Cursor Object
 */
export class Tuio2DCursor {
  sessionId: number;
  xPosition: number;
  yPosition: number;
  xVelocity: number;
  yVelocity: number;
  motionAcceleration: number;

  constructor(message: TuioMessage) {
    this.sessionId = message.sessionId;
    this.xPosition = message.xPosition;
    this.yPosition = message.yPosition;
    this.xVelocity = message.xVelocity;
    this.yVelocity = message.yVelocity;
    this.motionAcceleration = message.motionAcceleration;
  }
}
