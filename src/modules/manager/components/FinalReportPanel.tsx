/* === 院长视角模块：最终决策报告面板 === */

import { useMemo } from 'react';
import {
  TOTAL_BUDGET,
} from '../data/balanceData';
import type { WorkEvent, WorkEventResult } from '../data/eventData';
import type { ReputationRisk, FamilyCaller, FamilyCallOutcome } from '../data/managerState';
import styles from '../styles/manager.module.css';

/* ======== 决策标签 ======== */
type DecisionTag =
  | '安全优先型'
  | '尊严守护型'
  | '家属信任型'
  | '护理员减压型'
  | '运营保守型'
  | '压力转嫁型'
  | '信任受损型';

interface TagResult {
  primary: DecisionTag;
  secondary: DecisionTag;
}

function generateTags(
  indicators: Record<string, number>,
  selectedIds: string[],
  revokedIds: string[],
  reputationRisk: ReputationRisk,
): TagResult {
  // 分析各项指标
  const safety = indicators.safety ?? 45;
  const dignity = indicators.dignity ?? 42;
  const family = indicators.family ?? 46;
  const staff = indicators.staff ?? 60;
  const cost = indicators.cost ?? 55;

  const hasC1 = selectedIds.includes('c1');
  const hasC2 = selectedIds.includes('c2');
  const hasC3 = selectedIds.includes('c3');
  const hasC4 = selectedIds.includes('c4');
  const hasC5 = selectedIds.includes('c5');
  const hasC6 = selectedIds.includes('c6');

  const improvementScores: [DecisionTag, number][] = [];

  if (hasC1 || hasC5 || hasC6 || safety >= 60) improvementScores.push(['安全优先型', safety + (hasC1 ? 10 : 0) + (hasC5 ? 5 : 0) + (hasC6 ? 5 : 0)]);
  if (hasC3 || dignity >= 58) improvementScores.push(['尊严守护型', dignity + (hasC3 ? 10 : 0)]);
  if (hasC4 || family >= 60) improvementScores.push(['家属信任型', family + (hasC4 ? 10 : 0)]);
  if (hasC2 || staff <= 48) improvementScores.push(['护理员减压型', 100 - staff + (hasC2 ? 10 : 0)]);
  if (cost <= 50 && selectedIds.length <= 2) improvementScores.push(['运营保守型', 100 - cost]);

  // 检查牺牲方向
  if (staff >= 70 && !hasC2) improvementScores.push(['压力转嫁型', staff]);
  if (reputationRisk === 'high' || revokedIds.length >= 2) improvementScores.push(['信任受损型', revokedIds.length * 20 + (reputationRisk === 'high' ? 30 : 0)]);
  if (family <= 32 && !hasC4) improvementScores.push(['信任受损型', 100 - family]);
  if (reputationRisk === 'medium' && revokedIds.length > 0) improvementScores.push(['信任受损型', revokedIds.length * 15]);

  if (improvementScores.length === 0) {
    return { primary: '运营保守型', secondary: '压力转嫁型' };
  }

  improvementScores.sort((a, b) => b[1] - a[1]);

  const primary = improvementScores[0][0];
  // 找不同类别的副标签
  const secondary = improvementScores.find(([tag]) => tag !== primary)?.[0]
    ?? (improvementScores[1]?.[0] ?? '运营保守型');

  return { primary, secondary: secondary === primary ? '运营保守型' : secondary };
}

/* ======== 四方反馈 ======== */
interface QuadFeedback {
  elderly: string;
  family: string;
  caregiver: string;
  management: string;
}

function generateQuadFeedback(
  indicators: Record<string, number>,
  selectedIds: string[],
): QuadFeedback {
  const safety = indicators.safety ?? 45;
  const dignity = indicators.dignity ?? 42;
  const family = indicators.family ?? 46;
  const staff = indicators.staff ?? 60;
  const cost = indicators.cost ?? 55;

  // 老人反馈
  let elderly: string;
  if (dignity >= 60 && safety >= 55) {
    elderly = '活动室重新热闹起来，走廊亮堂了，老人们走路也有底气了。被尊重的感觉让他们的眼睛有了光。';
  } else if (safety >= 50 && dignity >= 48) {
    elderly = '老人们的基本生活有保障，安全感尚可。但活动安排变少，有些老人大部分时间在房间里看电视。';
  } else if (dignity <= 38) {
    elderly = '活动室冷冷清清，几位老人整天坐着发呆。安全感不足让腿脚不便的老人不敢独自走动。';
  } else {
    elderly = '老人们感受复杂。有的觉得安全了不少，有的觉得生活单调，被照顾是好事，但也想要一点自己的节奏。';
  }

  // 家属反馈
  let familyFeedback: string;
  if (family >= 60 && selectedIds.includes('c4')) {
    familyFeedback = '家属群里的感谢多过投诉了。主动的沟通让家属感到被重视，探访流程简化后，来院频率也提高了。';
  } else if (family >= 45) {
    familyFeedback = '家属们总体安心，但也有人反馈"有时想了解情况不太方便"。满意度在正常范围内，但仍有提升空间。';
  } else {
    familyFeedback = '家属的担忧写在脸上。投诉虽没有升级，但不信任的种子已经埋下。他们想知道老人在里面过得好不好。';
  }

  // 护理员反馈
  let caregiver: string;
  if (staff <= 48 && selectedIds.includes('c2')) {
    caregiver = '人手终于缓过来一点了。几位护理员轮班能吃上一顿不赶时间的午饭。虽然依旧不轻松，但至少有人在意的感觉让人还能撑住。';
  } else if (staff >= 70) {
    caregiver = '护理员们的背脊越来越弯。连续高强度工作让好几个人都在硬撑。排班表上永远填不满。他们没抱怨，但沉默本身比任何抱怨都重。';
  } else if (staff >= 55) {
    caregiver = '护理员们累，但还在支撑。他们理解预算有限，但也希望院长能看见——每一份疲惫都是真实的。';
  } else {
    caregiver = '护理员团队仍在坚持。这份坚持里，有专业、有责任，也有无声的疲惫。';
  }

  // 运营管理反馈
  let management: string;
  if (cost <= 48) {
    management = '账面上看，这个月守住了底线。运营成本没有继续攀升，合规检查的准备也做得不错。但下个季度呢？可持续性仍是最大的问号。';
  } else if (cost >= 70) {
    management = '财务部递来的报表让王会计擦了三次眼镜。运营成本在往上走，长期可持续性亮起红灯。短期能撑，但账本不会说谎。';
  } else {
    management = '运营部的同事们看着报表，有人叹气有人沉默。没有破产危机，但每一分钱都花在刀刃上——刀刃也在变钝。';
  }

  return { elderly, family: familyFeedback, caregiver, management };
}

/* ======== 院长内心独白 ======== */
function generateMonologue(
  caller: FamilyCaller | null,
  choiceId: string | null,
  revokedCount: number,
  reputationRisk: ReputationRisk,
  indicators: Record<string, number>,
  familyCallOutcome?: FamilyCallOutcome | null,
): string {
  const parts: string[] = [];

  // 家庭部分 — 优先使用 familyCallOutcome（更细粒度）
  if (caller === 'child') {
    if (familyCallOutcome === 'missedThenCalledBack' || familyCallOutcome === 'rejectedThenCalledBack') {
      parts.push('他终究还是回拨了那个电话。孩子的声音隔着听筒传来时，办公室里的灯已经亮了很久。');
    } else if (familyCallOutcome === 'answeredThenCalledBack') {
      parts.push('他又拨了一次孩子的电话。那头的语气没变，但他在挂断后沉默了很久。');
    } else if (familyCallOutcome === 'callLaterThenCalledBack') {
      parts.push('他说忙完就回拨。孩子的声音从听筒里传来时，他下意识看了一眼墙上的钟——又过去了好几个小时。');
    } else if (choiceId === 'answer' || familyCallOutcome === 'answered') {
      parts.push('他听见孩子的声音，才想起自己也很久没有好好坐下来吃一顿饭。');
    } else if (choiceId === 'call_later' || familyCallOutcome === 'callLater') {
      parts.push('他说等忙完就回拨，可办公室的灯又亮了很久。');
    } else if (familyCallOutcome === 'missed') {
      parts.push('电话响到自动挂断。他错过了那通电话，也错过了今晚陪孩子吃饭的机会。');
    } else if (familyCallOutcome === 'rejected') {
      parts.push('他亲手挂断了孩子的电话。办公室里只剩下报表和待处理事项。');
    } else if (choiceId === 'ignore') {
      parts.push('电话屏幕暗下去，办公室里只剩下报表和待处理事项。');
    }
  } else if (caller === 'spouse') {
    if (familyCallOutcome === 'missedThenCalledBack' || familyCallOutcome === 'rejectedThenCalledBack') {
      parts.push('他终究还是回拨了那个电话。那头的声音很轻，他忽然意识到自己已经很久没有好好听她说话了。');
    } else if (familyCallOutcome === 'answeredThenCalledBack') {
      parts.push('他又拨了一次爱人的电话。听到那句"别总一个人撑着"，他眼眶忽然热了一下。');
    } else if (familyCallOutcome === 'callLaterThenCalledBack') {
      parts.push('他说会尽早回去。挂断后过了很久才回拨，那头的语气没变，声音却让他心里沉了一下。');
    } else if (choiceId === 'answer' || familyCallOutcome === 'answered') {
      parts.push('听到那句"别总一个人撑着"，他眼眶忽然热了一下，但没让电话那头听见。');
    } else if (choiceId === 'call_later' || familyCallOutcome === 'callLater') {
      parts.push('他说会尽早回去。挂断时，他甚至不确定自己今晚还回不回去。');
    } else if (familyCallOutcome === 'missed') {
      parts.push('电话响到自动挂断。他错过了那通电话，也错过了今晚听听她声音的机会。');
    } else if (familyCallOutcome === 'rejected') {
      parts.push('他亲手挂断了爱人的电话。办公室的安静忽然变得很重。');
    } else if (choiceId === 'ignore') {
      parts.push('手机震了三下就安静了。他盯着屏幕上的未接来电，很久没有动。');
    }
  }

  // 撤销承诺部分
  if (revokedCount > 0) {
    const review = reputationRisk === 'high'
      ? '撤销承诺的决定沉甸甸地压在案头。他知道那些人会失望，但今夜已经没有更好的牌了。'
      : '做过承诺又收回——没有人想这样。希望有一天不再需要做这样的权衡。';
    parts.push(review);
  }

  // 最明显牺牲方向
  const safety = indicators.safety ?? 45;
  const dignity = indicators.dignity ?? 42;
  const family = indicators.family ?? 46;
  const staff = indicators.staff ?? 60;
  const cost = indicators.cost ?? 55;

  if (staff >= 70) {
    parts.push('护理员们还在撑着。这份沉默比任何抱怨都更让他不安。');
  } else if (family <= 35) {
    parts.push('家属的信任在悄悄流失。他知道一个电话、一句解释都远远不够。');
  } else if (dignity <= 35) {
    parts.push('活动室安静了。老人们的尊严不只是一句口号，它是被看见、被尊重、被当作一个人。');
  } else if (safety <= 35) {
    parts.push('安全的缺口不是今天才出现的。他只是希望今晚不要再有人摔倒。');
  } else if (cost >= 70) {
    parts.push('账本上的数字不会说谎。他知道下个季度更紧的日子还在后头。');
  }

  // 总体收束
  if (parts.length === 0) {
    parts.push('他关上电脑，办公室安静下来。窗外已经全黑了。他想起自己也是某个人的家人，却已经很久没有准时回去吃过一顿饭。');
  } else {
    parts.push('窗外已经全黑了。没有完美答案，正因如此，才更需要被看见。');
  }

  return parts.join(' ');
}

/* ==================== 主组件 ==================== */

interface FinalReportPanelProps {
  selectedIds: string[];
  committedIds: string[];
  remainingBudget: number;
  indicators: Record<string, number>;
  workEventResults: WorkEventResult[];
  activeWorkEvents: WorkEvent[];
  familyCaller: FamilyCaller | null;
  familyCallChoice: string | null;
  familyCallOutcome?: FamilyCallOutcome | null;
  reputationRisk: ReputationRisk;
  /** 第二轮撤销的项 */
  revokedIds: string[];
  onConfirm: () => void;
}

export function FinalReportPanel({
  selectedIds,
  committedIds,
  remainingBudget,
  indicators,
  workEventResults,
  familyCaller,
  familyCallChoice,
  familyCallOutcome,
  reputationRisk,
  revokedIds,
  onConfirm,
}: FinalReportPanelProps) {
  const tags = useMemo(
    () => generateTags(indicators, selectedIds, revokedIds, reputationRisk),
    [indicators, selectedIds, revokedIds, reputationRisk],
  );

  const quadFeedback = useMemo(
    () => generateQuadFeedback(indicators, selectedIds),
    [indicators, selectedIds],
  );

  const monologue = useMemo(
    () => generateMonologue(familyCaller, familyCallChoice, revokedIds.length, reputationRisk, indicators, familyCallOutcome),
    [familyCaller, familyCallChoice, revokedIds.length, reputationRisk, indicators, familyCallOutcome],
  );

  const totalSpent = TOTAL_BUDGET - remainingBudget;

  const careQualityKeys = ['safety', 'dignity', 'family'] as const;
  const opPressureKeys = ['cost', 'staff'] as const;
  const careSum = careQualityKeys.reduce((s, k) => s + (indicators[k] ?? 0), 0);
  const opSum = opPressureKeys.reduce((s, k) => s + (indicators[k] ?? 0), 0);

  return (
    <div className={styles.finalReportOverlay}>
      <div className={styles.finalReportPanel}>
        <h1 className={styles.finalReportTitle}>📋 最终决策报告</h1>
        <p className={styles.finalReportSubtitle}>管理者决策记录——本月</p>

        {/* 1. 决策倾向标签 */}
        <section className={styles.finalReportSection}>
          <h2 className={styles.finalReportSectionTitle}>决策倾向</h2>
          <div className={styles.finalReportTags}>
            <span className={styles.finalReportTagPrimary}>{tags.primary}</span>
            <span className={styles.finalReportTagSecondary}>{tags.secondary}</span>
          </div>
          <p className={styles.finalReportTagNote}>
            此标签基于最终指标、撤销决策和信誉风险综合生成，反映决策倾向，不代表好坏评价。
          </p>
        </section>

        {/* 2. 管理结果摘要 */}
        <section className={styles.finalReportSection}>
          <h2 className={styles.finalReportSectionTitle}>管理结果摘要</h2>
          <div className={styles.finalReportSummary}>
            <div className={styles.finalReportRow}>
              <span className={styles.finalReportLabel}>最终使用预算</span>
              <span className={styles.finalReportValue}>{totalSpent} / {TOTAL_BUDGET} 分</span>
            </div>
            <div className={styles.finalReportRow}>
              <span className={styles.finalReportLabel}>最终剩余预算</span>
              <span className={styles.finalReportValue}>{remainingBudget} 分</span>
            </div>
            <div className={styles.finalReportRow}>
              <span className={styles.finalReportLabel}>最终选择项目</span>
              <span className={styles.finalReportValue}>
                {selectedIds.length} 项
                {selectedIds.length === 0 && '（未做新增投入）'}
              </span>
            </div>
            <div className={styles.finalReportRow}>
              <span className={styles.finalReportLabel}>第一轮已承诺</span>
              <span className={styles.finalReportValue}>{committedIds.length} 项</span>
            </div>
            <div className={styles.finalReportRow}>
              <span className={styles.finalReportLabel}>第二轮撤销</span>
              <span className={`${styles.finalReportValue} ${revokedIds.length > 0 ? styles.reportDanger : styles.reportGood}`}>
                {revokedIds.length > 0 ? `${revokedIds.length} 项` : '无'}
              </span>
            </div>
            <div className={styles.finalReportRow}>
              <span className={styles.finalReportLabel}>信誉风险</span>
              <span className={`${styles.finalReportValue} ${reputationRisk === 'high' ? styles.reportDanger : reputationRisk === 'medium' ? styles.reportWarn : styles.reportGood}`}>
                {reputationRisk === 'low' ? '低' : reputationRisk === 'medium' ? '中' : '高'}
              </span>
            </div>
            {revokedIds.length > 0 && (
              <div className={styles.finalReportRow}>
                <span className={styles.finalReportLabel}>信誉风险说明</span>
                <span className={`${styles.finalReportValue} ${styles.reportDanger}`}>
                  {reputationRisk === 'high'
                    ? '撤销承诺次数较多，各方信任已明显受损'
                    : '撤销承诺带来了一定信誉风险，相关方会注意这个信号'}
                </span>
              </div>
            )}
            {selectedIds.length === 0 && (
              <p className={styles.finalReportNullNote}>
                本月未新增任何投入。问题不会自动消失，现存压力将由现有人员和老人共同承担。
              </p>
            )}
          </div>
        </section>

        {/* 3. 四方反馈 */}
        <section className={styles.finalReportSection}>
          <h2 className={styles.finalReportSectionTitle}>四方反馈</h2>
          <div className={styles.finalReportQuadGrid}>
            <div className={styles.finalReportQuadCard}>
              <h4 className={styles.finalReportQuadTitle}>👴 老人</h4>
              <p className={styles.finalReportQuadText}>{quadFeedback.elderly}</p>
            </div>
            <div className={styles.finalReportQuadCard}>
              <h4 className={styles.finalReportQuadTitle}>👨‍👩‍👧 家属</h4>
              <p className={styles.finalReportQuadText}>{quadFeedback.family}</p>
            </div>
            <div className={styles.finalReportQuadCard}>
              <h4 className={styles.finalReportQuadTitle}>👩‍⚕️ 护理员</h4>
              <p className={styles.finalReportQuadText}>{quadFeedback.caregiver}</p>
            </div>
            <div className={styles.finalReportQuadCard}>
              <h4 className={styles.finalReportQuadTitle}>🏛️ 管理部门/运营方</h4>
              <p className={styles.finalReportQuadText}>{quadFeedback.management}</p>
            </div>
          </div>
        </section>

        {/* 4. 突发事件复盘 */}
        <section className={styles.finalReportSection}>
          <h2 className={styles.finalReportSectionTitle}>突发事件复盘</h2>
          <div className={styles.finalReportEventList}>
            {workEventResults.map((result, i) => {
              const option = result.event.options.find(o => o.id === result.chosenOptionId);
              return (
                <div key={i} className={styles.finalReportEventCard}>
                  <h4 className={styles.finalReportEventName}>
                    {i + 1}. {result.event.title}
                    <span className={`${styles.eventSeverityTag} ${styles[`severity${result.event.severity.charAt(0).toUpperCase() + result.event.severity.slice(1)}`]}`}>
                      {result.event.severity === 'low' ? '低' : result.event.severity === 'medium' ? '中' : '高'}风险
                    </span>
                  </h4>
                  <p className={styles.finalReportEventDesc}>{result.event.description}</p>
                  <div className={styles.finalReportEventOutcome}>
                    <span className={styles.finalReportEventLabel}>处理方式：</span>
                    <span>{option?.label ?? '未知'}</span>
                  </div>
                  <div className={styles.finalReportEventNote}>
                    <span className={styles.finalReportEventLabel}>系统记录：</span>
                    <span>{result.systemNotification}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. 院长内心独白 */}
        <section className={styles.finalReportSection}>
          <h2 className={styles.finalReportSectionTitle}>院长手记</h2>
          <div className={styles.finalReportMonologue}>
            <p className={styles.finalReportMonologueText}>
              “{monologue}”
            </p>
          </div>
        </section>

        {/* 6. 资源天平 */}
        <section className={styles.finalReportSection}>
          <h2 className={styles.finalReportSectionTitle}>资源天平</h2>
          <div className={styles.finalReportScale}>
            <div className={styles.finalReportScaleSide}>
              <span className={styles.finalReportScaleLabel}>照护质量</span>
              <span className={styles.finalReportScaleValue}>{careSum}</span>
            </div>
            <div className={styles.finalReportScaleBar}>
              <div
                className={styles.finalReportScaleFill}
                style={{
                  width: `${Math.min(100, (careSum / (careSum + opSum)) * 100)}%`,
                }}
              />
            </div>
            <div className={styles.finalReportScaleSide}>
              <span className={styles.finalReportScaleLabel}>运营压力</span>
              <span className={styles.finalReportScaleValue}>{opSum}</span>
            </div>
          </div>
        </section>

        {/* 7. 确认 */}
        <div className={styles.finalReportActions}>
          <button className={styles.finalReportConfirmBtn} onClick={onConfirm}>
            确认报告，结束这一天
          </button>
        </div>
      </div>
    </div>
  );
}
