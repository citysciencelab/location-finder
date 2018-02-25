export interface TuioMessage {
  profile: string;
  type: 'source' | 'alive' | 'set' | 'fseq';
  // source (?)
  address?: string;
  // alive
  sessionIds?: number[];
  // set
  sessionId?: number;
  classId?: number;
  xPosition?: number;
  yPosition?: number;
  aAngle?: number;
  xVelocity?: number;
  yVelocity?: number;
  aRotationSpeed?: number;
  motionAcceleration?: number;
  rotationAccleration: number; // sic!
  // fseq
  frameID?: number;
}
