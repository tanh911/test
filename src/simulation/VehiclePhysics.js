/**
 * 🚘 VehiclePhysics.js
 * High-precision vehicle dynamics & Ackermann kinematic steering engine
 * Model calibrated for 2,500 kg Toyota Corolla / German Fahrschule Training Car
 */

export const VEHICLE_PARAMS = {
  mass: 1450,           // 1,450 kg Sedan Curb Weight
  wheelbase: 2.70,      // L = 2.70m front-to-rear axle distance
  trackWidth: 1.54,     // W = 1.54m front track width
  tireRadius: 0.31,     // R = 0.31m (205/55 R16 tires)
  maxSteerAngle: 0.58,  // ~33 degrees max front wheel turn angle
  cd: 0.28,             // Drag coefficient
  frontalArea: 2.2,     // Frontal area in m^2
  rollingCoeff: 0.015   // Tire rolling resistance coefficient
};

export class VehiclePhysics {
  constructor() {
    this.speed = 0;           // speed in km/h
    this.velocity = 0;        // speed in m/s
    this.steer = 0;           // Normalized steer input [-1, 1]
    this.targetSteer = 0;     // Target steer input [-1, 1]
    this.heading = 0;         // Yaw angle in radians
    this.carX = 1.6;          // Lateral lane position (m)
    this.wheelRotation = 0;   // Angular wheel spin angle (rad)
    this.pitch = 0;           // Weight transfer pitch angle (rad)
    this.roll = 0;            // Weight transfer roll angle (rad)
    this.absActive = false;   // ABS braking status
    this.espActive = false;   // ESP stability control status
  }

  update(dt, inputs, weatherMode = 'day') {
    const { isDriving, isThrottle, isBrake, isNitro, gear = 'D', clutch = 1.0 } = inputs;
    const { mass, wheelbase, trackWidth, tireRadius, maxSteerAngle } = VEHICLE_PARAMS;

    // Hệ số bám đường theo thời tiết (Surface Grip Friction)
    const gripCoeff = weatherMode === 'snow' ? 0.35 : weatherMode === 'rain' ? 0.72 : 1.0;

    // 1. Force-Based Acceleration & Resistance Dynamics
    if (isDriving) {
      let engineForce = isNitro ? 12000 : isThrottle ? (this.speed < 50 ? 5800 : 1800) : (this.velocity < 0.8 ? 250 : 0);
      engineForce *= clutch; // Tác động côn (Clutch engagement)

      let brakeForce = isBrake ? 16000 * gripCoeff : 0;
      this.absActive = isBrake && gripCoeff < 0.8;

      const rollingResistance = VEHICLE_PARAMS.rollingCoeff * mass * 9.81;
      const aeroDrag = 0.5 * 1.225 * VEHICLE_PARAMS.cd * VEHICLE_PARAMS.frontalArea * (this.velocity * this.velocity);

      const propulsiveForce = gear === 'R' ? -engineForce * 0.7 : engineForce;
      const retardingForce = (Math.abs(this.velocity) > 0.05 ? (brakeForce + rollingResistance + aeroDrag) : (isBrake ? brakeForce : 0));

      const netForce = (propulsiveForce > 0 ? propulsiveForce - retardingForce : propulsiveForce + retardingForce);
      const acceleration = netForce / mass;

      this.velocity += acceleration * dt;
      if (gear === 'D' || gear === 'P' || gear === 'N') {
        this.velocity = Math.max(0, this.velocity);
      } else if (gear === 'R') {
        this.velocity = Math.min(0, this.velocity);
      }
      this.speed = Math.abs(this.velocity) * 3.6;
    } else {
      this.velocity = Math.sign(this.velocity) * Math.max(0, Math.abs(this.velocity) - 10.0 * dt);
      this.speed = Math.abs(this.velocity) * 3.6;
    }

    // 2. Dynamic Weight Transfer (Pitch & Roll Chassis Motion)
    const targetPitch = (isBrake ? -0.04 : isThrottle ? 0.03 : 0) * (this.speed / 50);
    this.pitch += (targetPitch - this.pitch) * Math.min(1, 10.0 * dt);

    // 3. Ackermann Kinematic Steering & Yaw Rate Dynamics
    this.steer += (this.targetSteer - this.steer) * Math.min(1, 8.0 * dt);
    const delta = this.steer * maxSteerAngle * gripCoeff;

    let deltaL = delta;
    let deltaR = delta;
    if (Math.abs(delta) > 0.001) {
      const tanD = Math.tan(delta);
      deltaL = Math.atan2(wheelbase * tanD, wheelbase + 0.5 * trackWidth * tanD);
      deltaR = Math.atan2(wheelbase * tanD, wheelbase - 0.5 * trackWidth * tanD);
    }

    if (Math.abs(this.velocity) > 0.08) {
      const yawRate = (this.velocity / wheelbase) * Math.tan(delta);
      this.heading += yawRate * dt;
      this.heading += (-this.heading) * Math.min(1, 3.5 * dt);

      const lateralVel = this.velocity * Math.sin(this.heading);
      this.carX += lateralVel * dt * 2.2;

      const targetRoll = -Math.sin(delta) * (this.speed / 60) * 0.06;
      this.roll += (targetRoll - this.roll) * Math.min(1, 8.0 * dt);
      this.espActive = Math.abs(targetRoll) > 0.04;
    } else {
      this.heading += (-this.heading) * Math.min(1, 5.0 * dt);
      this.roll += (-this.roll) * Math.min(1, 5.0 * dt);
    }
    this.carX = Math.max(-6.8, Math.min(6.8, this.carX));

    // 4. Wheel Spin Angle
    this.wheelRotation += (this.velocity / tireRadius) * dt;

    return {
      speed: this.speed,
      velocity: this.velocity,
      steer: this.steer,
      heading: this.heading,
      carX: this.carX,
      wheelRotation: this.wheelRotation,
      pitch: this.pitch,
      roll: this.roll,
      absActive: this.absActive,
      espActive: this.espActive,
      deltaL,
      deltaR
    };
  }
}
