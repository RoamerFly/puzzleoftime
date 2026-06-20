/**
 * === 院长视角模块：音频资源索引 ===
 *
 * 所有音频资源都在 src/modules/manager/assets/audio/ 下，
 * 不放到公共目录。
 */

// ── BGM ──
import managerBgmDayLoop from './audio/bgm/manager_bgm_day_loop.mp3';
import managerBgmNightLoop from './audio/bgm/manager_bgm_night_loop.mp3';
import managerBgmPressureLoop from './audio/bgm/manager_bgm_pressure_loop.mp3';

// ── 环境音 ──
import ambOfficeDayLoop from './audio/ambience/amb_office_day_loop.mp3';
import ambOfficeNightLoop from './audio/ambience/amb_office_night_loop.mp3';
import ambCricketsNightLoop from './audio/ambience/amb_crickets_night_loop.mp3';

// ── 交互音效 ──
import sfxComputerPowerOn from './audio/sfx/sfx_computer_power_on.mp3';
import sfxUiClick from './audio/sfx/sfx_ui_click.mp3';
import sfxUiConfirm from './audio/sfx/sfx_ui_confirm.mp3';
import sfxUiError from './audio/sfx/sfx_ui_error.mp3';
import sfxNotification from './audio/sfx/sfx_notification.mp3';
import sfxReportGenerate from './audio/sfx/sfx_report_generate.mp3';
import sfxPhoneRingLoop from './audio/sfx/sfx_phone_ring_loop.mp3';
import sfxPhonePickup from './audio/sfx/sfx_phone_pickup.mp3';
import sfxPhoneHangup from './audio/sfx/sfx_phone_hangup.mp3';
import sfxPhoneDialing from './audio/sfx/sfx_phone_dialing.mp3';
import sfxPhoneConnected from './audio/sfx/sfx_phone_connected.mp3';

// ── 电话对白配音 ──
import voiceCaregiverLeave01 from './audio/voice/voice_caregiver_leave_01.mp3.mp3';
import voiceCaregiverLeave02 from './audio/voice/voice_caregiver_leave_02.mp3.mp3';
import voiceCaregiverLeave03 from './audio/voice/voice_caregiver_leave_03.mp3.mp3';
import voiceFallRisk01 from './audio/voice/voice_fall_risk_01.mp3.mp3';
import voiceFallRisk02 from './audio/voice/voice_fall_risk_02.mp3.mp3';
import voiceFallRisk03 from './audio/voice/voice_fall_risk_03.mp3.mp3';
import voiceFamilyComplaint01 from './audio/voice/voice_family_complaint_01.mp3.mp3';
import voiceFamilyComplaint02 from './audio/voice/voice_family_complaint_02.mp3.mp3';
import voiceFamilyComplaint03 from './audio/voice/voice_family_complaint_03.mp3.mp3';
import voiceInspectionNotice01 from './audio/voice/voice_inspection_notice_01.mp3.mp3';
import voiceInspectionNotice02 from './audio/voice/voice_inspection_notice_02.mp3.mp3';
import voiceInspectionNotice03 from './audio/voice/voice_inspection_notice_03.mp3.mp3';
import voiceChildCall01 from './audio/voice/voice_child_call_01.mp3';
import voiceChildCall02 from './audio/voice/voice_child_call_02.mp3';
import voiceSpouseCall01 from './audio/voice/voice_spouse_call_01.mp3';
import voiceSpouseCall02 from './audio/voice/voice_spouse_call_02.mp3';

/** 音频资源配置（所有资源保持在 manager 模块内部） */
export const managerAudioAssets = {
  bgm: {
    day: managerBgmDayLoop,
    night: managerBgmNightLoop,
    pressure: managerBgmPressureLoop,
  },
  ambience: {
    officeDay: ambOfficeDayLoop,
    officeNight: ambOfficeNightLoop,
    cricketsNight: ambCricketsNightLoop,
  },
  sfx: {
    computerPowerOn: sfxComputerPowerOn,
    uiClick: sfxUiClick,
    uiConfirm: sfxUiConfirm,
    uiError: sfxUiError,
    notification: sfxNotification,
    reportGenerate: sfxReportGenerate,
    phoneRing: sfxPhoneRingLoop,
    phonePickup: sfxPhonePickup,
    phoneHangup: sfxPhoneHangup,
    phoneDialing: sfxPhoneDialing,
    phoneConnected: sfxPhoneConnected,
  },
  voice: {
    caregiverLeave01: voiceCaregiverLeave01,
    caregiverLeave02: voiceCaregiverLeave02,
    caregiverLeave03: voiceCaregiverLeave03,
    fallRisk01: voiceFallRisk01,
    fallRisk02: voiceFallRisk02,
    fallRisk03: voiceFallRisk03,
    familyComplaint01: voiceFamilyComplaint01,
    familyComplaint02: voiceFamilyComplaint02,
    familyComplaint03: voiceFamilyComplaint03,
    inspectionNotice01: voiceInspectionNotice01,
    inspectionNotice02: voiceInspectionNotice02,
    inspectionNotice03: voiceInspectionNotice03,
    childCall01: voiceChildCall01,
    childCall02: voiceChildCall02,
    spouseCall01: voiceSpouseCall01,
    spouseCall02: voiceSpouseCall02,
  },
} as const;

/** 音量建议值 */
export const AUDIO_VOLUMES = {
  bgm: 0.22,
  bgmPressure: 0.20,
  ambienceOffice: 0.16,
  ambienceCrickets: 0.10,
  sfxUi: 0.35,
  sfxPhoneRing: 0.45,
  sfxPhonePickup: 0.45,
  sfxPhoneHangup: 0.45,
  sfxVoice: 0.85,
  sfxReportGenerate: 0.40,
  sfxNotification: 0.35,
  sfxComputerPowerOn: 0.35,
} as const;

/**
 * 工作电话配音映射：
 *   eventType → lineIndex → voiceAssetKey
 *
 * lineIndex 0 = 第1句 caller
 * lineIndex 1 = 第2句 caller
 * lineIndex 2 = 第3句 caller
 */
export const WORK_EVENT_VOICE_MAP: Record<string, Record<number, string>> = {
  caregiver_leave: {
    0: 'caregiverLeave01',
    1: 'caregiverLeave02',
    2: 'caregiverLeave03',
  },
  fall_risk: {
    0: 'fallRisk01',
    1: 'fallRisk02',
    2: 'fallRisk03',
  },
  family_complaint: {
    0: 'familyComplaint01',
    1: 'familyComplaint02',
    2: 'familyComplaint03',
  },
  inspection_notice: {
    0: 'inspectionNotice01',
    1: 'inspectionNotice02',
    2: 'inspectionNotice03',
  },
};

/**
 * 家庭电话配音映射：
 *   caller → lineIndex → voiceAssetKey
 */
export const FAMILY_CALL_VOICE_MAP: Record<string, Record<number, string>> = {
  child: {
    0: 'childCall01',
    1: 'childCall02',
  },
  spouse: {
    0: 'spouseCall01',
    1: 'spouseCall02',
  },
};
