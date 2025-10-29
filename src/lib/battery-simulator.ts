/**
 * Battery Simulator
 *
 * Simulates realistic battery behavior including charge/discharge cycles,
 * temperature effects, voltage curves, and health degradation.
 */

import type { Site } from '../db/schema/sites'

/**
 * Battery configuration parameters
 */
export interface BatteryConfig {
  /** Nominal voltage in volts (e.g., 500V) */
  nominalVoltage: number
  /** Total capacity in kWh */
  capacityKwh: number
  /** Minimum state of charge (0.20 = 20%) */
  minSoc: number
  /** Maximum state of charge (0.95 = 95%) */
  maxSoc: number
  /** Maximum charge rate as C-rate (0.5 = 0.5C) */
  maxChargeRateC: number
  /** Maximum discharge rate as C-rate (1.0 = 1C) */
  maxDischargeRateC: number
  /** Charging efficiency (0.95 = 95%) */
  chargingEfficiency: number
  /** Discharging efficiency (0.95 = 95%) */
  dischargingEfficiency: number
  /** Self-discharge rate per minute (0.00001 = very low) */
  selfDischargeRate: number
  /** Optimal temperature in °C */
  temperatureOptimal: number
}

/**
 * Battery state at a point in time
 */
export interface BatteryState {
  /** State of charge (0-1, where 1 = 100%) */
  soc: number
  /** Voltage in volts */
  voltage: number
  /** Current in amps (negative = charging, positive = discharging) */
  current: number
  /** Temperature in °C */
  temperature: number
  /** Health percentage (0-100) */
  health: number
  /** Total charge/discharge cycles */
  cycleCount: number
}

/**
 * Simulation result for a time step
 */
export interface SimulationResult {
  /** Updated battery state */
  batteryState: BatteryState
  /** Grid import power in kW (positive = importing) */
  gridImportKw: number
  /** Grid export power in kW (positive = exporting) */
  gridExportKw: number
}

/**
 * Default battery configuration values
 */
const DEFAULT_CONFIG: Omit<BatteryConfig, 'nominalVoltage' | 'capacityKwh'> = {
  minSoc: 0.20, // 20%
  maxSoc: 0.95, // 95%
  maxChargeRateC: 0.5, // 0.5C charge rate
  maxDischargeRateC: 1.0, // 1C discharge rate
  chargingEfficiency: 0.95, // 95%
  dischargingEfficiency: 0.95, // 95%
  selfDischargeRate: 0.00001, // ~0.87% per day
  temperatureOptimal: 25, // 25°C
}

/**
 * Battery Simulator Class
 *
 * Maintains battery state and simulates realistic behavior over time.
 */
export class BatterySimulator {
  private config: BatteryConfig
  private state: BatteryState

  /**
   * Creates a new battery simulator
   *
   * @param site - Site with battery specifications
   * @param initialState - Optional initial battery state
   */
  constructor(site: Site, initialState?: Partial<BatteryState>) {
    this.config = {
      nominalVoltage: site.nominalVoltage || 500,
      capacityKwh: site.batteryCapacityKwh || 50,
      ...DEFAULT_CONFIG,
    }

    // Initialize state
    this.state = {
      soc: initialState?.soc ?? 0.50, // Default 50%
      voltage: initialState?.voltage ?? this.config.nominalVoltage,
      current: initialState?.current ?? 0,
      temperature: initialState?.temperature ?? 25,
      health: initialState?.health ?? 98, // Default 98%
      cycleCount: initialState?.cycleCount ?? 0,
    }

    // Update voltage based on SOC
    this.state.voltage = this.calculateVoltage(this.state.soc)
  }

  /**
   * Simulates battery behavior for a time duration
   *
   * Energy flow: Solar + Grid = Load + Battery Change + Export
   *
   * @param durationMinutes - Simulation duration in minutes
   * @param solarPowerKw - Solar power available in kW
   * @param loadPowerKw - Load consumption in kW
   * @param ambientTemperature - Ambient temperature in °C
   * @param gridAvailable - Whether grid connection is available
   * @returns Simulation result with updated state and grid power
   */
  simulate(
    durationMinutes: number,
    solarPowerKw: number,
    loadPowerKw: number,
    ambientTemperature: number,
    gridAvailable: boolean = true
  ): SimulationResult {
    // Calculate net power: positive = surplus, negative = deficit
    const netPowerKw = solarPowerKw - loadPowerKw

    let gridImportKw = 0
    let gridExportKw = 0
    let batteryPowerKw = 0

    if (netPowerKw > 0) {
      // Surplus power: charge battery or export to grid
      batteryPowerKw = this.calculateChargePower(netPowerKw, durationMinutes)

      const excessPower = netPowerKw - batteryPowerKw
      if (excessPower > 0 && gridAvailable) {
        gridExportKw = excessPower
      }
    } else {
      // Power deficit: discharge battery or import from grid
      const deficitPowerKw = Math.abs(netPowerKw)

      batteryPowerKw = -this.calculateDischargePower(deficitPowerKw, durationMinutes)

      const remainingDeficit = deficitPowerKw + batteryPowerKw // batteryPowerKw is negative
      if (remainingDeficit > 0.01) {
        if (gridAvailable) {
          gridImportKw = remainingDeficit
        }
        // If grid not available, there's a power shortfall (load shedding)
      }
    }

    // Update battery state
    this.updateState(batteryPowerKw, durationMinutes, ambientTemperature)

    return {
      batteryState: { ...this.state },
      gridImportKw,
      gridExportKw,
    }
  }

  /**
   * Calculates how much power can be used to charge the battery
   *
   * @param availablePowerKw - Available surplus power
   * @param durationMinutes - Time duration in minutes
   * @returns Charge power in kW
   */
  private calculateChargePower(
    availablePowerKw: number,
    durationMinutes: number
  ): number {
    // Maximum charge power based on C-rate
    const maxChargePowerKw = this.config.capacityKwh * this.config.maxChargeRateC

    // Calculate how much energy is needed to reach maxSoc
    const energyNeededKwh =
      (this.config.maxSoc - this.state.soc) * this.config.capacityKwh

    // Power needed to charge to maxSoc in this duration
    const powerForMaxSocKw = (energyNeededKwh / durationMinutes) * 60

    // Take the minimum of available, max rate, and what's needed
    const chargePowerKw = Math.min(
      availablePowerKw,
      maxChargePowerKw,
      powerForMaxSocKw
    )

    return Math.max(0, chargePowerKw)
  }

  /**
   * Calculates how much power can be discharged from the battery
   *
   * @param requiredPowerKw - Required power deficit
   * @param durationMinutes - Time duration in minutes
   * @returns Discharge power in kW
   */
  private calculateDischargePower(
    requiredPowerKw: number,
    durationMinutes: number
  ): number {
    // Maximum discharge power based on C-rate
    const maxDischargePowerKw =
      this.config.capacityKwh * this.config.maxDischargeRateC

    // Calculate how much energy is available above minSoc
    const energyAvailableKwh =
      (this.state.soc - this.config.minSoc) * this.config.capacityKwh

    // Power available to discharge to minSoc in this duration
    const powerForMinSocKw = (energyAvailableKwh / durationMinutes) * 60

    // Take the minimum of required, max rate, and what's available
    const dischargePowerKw = Math.min(
      requiredPowerKw,
      maxDischargePowerKw,
      powerForMinSocKw
    )

    return Math.max(0, dischargePowerKw)
  }

  /**
   * Updates battery state based on power flow
   *
   * @param batteryPowerKw - Battery power (negative = charging, positive = discharging)
   * @param durationMinutes - Time duration in minutes
   * @param ambientTemperature - Ambient temperature in °C
   */
  private updateState(
    batteryPowerKw: number,
    durationMinutes: number,
    ambientTemperature: number
  ): void {
    // Calculate energy change (negative = charging)
    const durationHours = durationMinutes / 60
    let energyChangeKwh = batteryPowerKw * durationHours

    // Apply efficiency losses
    if (batteryPowerKw < 0) {
      // Charging: lose some energy to inefficiency
      energyChangeKwh *= this.config.chargingEfficiency
    } else if (batteryPowerKw > 0) {
      // Discharging: deliver less energy due to inefficiency
      energyChangeKwh /= this.config.dischargingEfficiency
    }

    // Apply self-discharge
    const selfDischargeKwh =
      this.state.soc * this.config.capacityKwh * this.config.selfDischargeRate * durationMinutes

    // Update SOC
    const socChange = (energyChangeKwh - selfDischargeKwh) / this.config.capacityKwh
    this.state.soc = Math.max(
      this.config.minSoc,
      Math.min(this.config.maxSoc, this.state.soc - socChange)
    )

    // Update voltage based on new SOC
    this.state.voltage = this.calculateVoltage(this.state.soc)

    // Update current (I = P / V)
    this.state.current =
      this.state.voltage > 0
        ? (Math.abs(batteryPowerKw) * 1000) / this.state.voltage
        : 0

    // Make current negative for charging
    if (batteryPowerKw < 0) {
      this.state.current = -this.state.current
    }

    // Update temperature
    this.updateTemperature(batteryPowerKw, ambientTemperature, durationMinutes)

    // Update health (very slow degradation)
    this.updateHealth(batteryPowerKw, durationMinutes)

    // Update cycle count (1 cycle = full charge/discharge)
    const cycleIncrement = Math.abs(energyChangeKwh) / this.config.capacityKwh
    this.state.cycleCount += cycleIncrement
  }

  /**
   * Calculates battery voltage from SOC using non-linear curve
   *
   * Li-ion batteries have a curved voltage-SOC relationship.
   *
   * @param soc - State of charge (0-1)
   * @returns Voltage in volts
   */
  private calculateVoltage(soc: number): number {
    const nominalVoltage = this.config.nominalVoltage
    const minVoltage = nominalVoltage * 0.96 // 480V for 500V nominal
    const maxVoltage = nominalVoltage * 1.04 // 520V for 500V nominal

    // Use square root curve for non-linearity
    // This approximates Li-ion voltage curves
    const voltageRange = maxVoltage - minVoltage
    const voltage = minVoltage + voltageRange * Math.sqrt(soc)

    return voltage
  }

  /**
   * Updates battery temperature based on power flow and ambient conditions
   *
   * @param batteryPowerKw - Battery power
   * @param ambientTemperature - Ambient temperature in °C
   * @param durationMinutes - Time duration in minutes
   */
  private updateTemperature(
    batteryPowerKw: number,
    ambientTemperature: number,
    durationMinutes: number
  ): void {
    // Heating from power flow (losses generate heat)
    const powerLossKw = Math.abs(batteryPowerKw) * 0.05 // 5% losses
    const heatingRate = powerLossKw * 0.5 // Simplified thermal model

    // Cooling toward ambient
    const coolingRate = (this.state.temperature - ambientTemperature) * 0.1

    // Update temperature
    const tempChange = (heatingRate - coolingRate) * (durationMinutes / 60)
    this.state.temperature = Math.max(
      -10,
      Math.min(60, this.state.temperature + tempChange)
    )
  }

  /**
   * Updates battery health (very slow degradation over time)
   *
   * @param batteryPowerKw - Battery power
   * @param durationMinutes - Time duration in minutes
   */
  private updateHealth(batteryPowerKw: number, durationMinutes: number): void {
    // Degradation factors
    const cycleStress = Math.abs(batteryPowerKw) / this.config.capacityKwh
    const tempStress = Math.abs(this.state.temperature - this.config.temperatureOptimal) / 20
    const socStress = this.state.soc < 0.3 || this.state.soc > 0.9 ? 0.5 : 0.1

    // Very slow degradation: ~2% per year under normal use
    const degradationRate = 0.00001 * (1 + cycleStress + tempStress + socStress)
    const healthLoss = degradationRate * durationMinutes

    this.state.health = Math.max(70, this.state.health - healthLoss)
  }

  /**
   * Gets current battery state
   *
   * @returns Current battery state
   */
  getState(): BatteryState {
    return { ...this.state }
  }

  /**
   * Sets battery state (useful for initialization)
   *
   * @param state - Partial state to update
   */
  setState(state: Partial<BatteryState>): void {
    this.state = { ...this.state, ...state }

    // Recalculate voltage if SOC changed
    if (state.soc !== undefined) {
      this.state.voltage = this.calculateVoltage(this.state.soc)
    }
  }
}

/**
 * Creates a battery simulator with default configuration
 *
 * @param site - Site with battery specifications
 * @param initialSoc - Optional initial state of charge (0-1)
 * @returns Battery simulator instance
 */
export const createBatterySimulator = (
  site: Site,
  initialSoc?: number
): BatterySimulator => {
  return new BatterySimulator(site, {
    soc: initialSoc ?? 0.50,
    temperature: 25,
    health: 98,
  })
}
