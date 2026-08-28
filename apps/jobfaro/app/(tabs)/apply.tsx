import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '@/src/store';
import { serveBase, backendMode } from '@/src/serve';
import { t } from '@/src/engine';
import { Btn, C, Card, Field, H, Pill, Sub, bandColor } from '@/src/ui';

// Export the beta report (1.55.0, web/desktop only): fetch the PII-free markdown from serve and hand it
// to the browser as a download — works identically in a plain browser tab and the Electron shell.
async function exportBetaReport(): Promise<void> {
  const r = await fetch(`${serveBase()}/report?format=md`);
  if (!r.ok) throw new Error(`report HTTP ${r.status}`);
  const blob = new Blob([await r.text()], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `jobfaro-beta-report-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Apply() {
  const profile = useStore((s) => s.profile);
  const scored = useStore((s) => s.scored);
  const verdicts = useStore((s) => s.verdicts);
  const feedback = useStore((s) => s.feedback);
  const scoring = useStore((s) => s.scoring);
  const rechecking = useStore((s) => s.rechecking);
  const tailored = useStore((s) => s.tailored);
  const { scoreOne, scoreTopN, rateVerdict, tailorOne, recheckListings } = useStore.getState();
  const lang = profile.language;
  const [dir, setDir] = useState<Record<string, string>>({});
  const queue = scored.filter((j) => j.confirm !== 'skip');
  const unscored = queue.filter((j) => !verdicts[j.url]).length;

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 56 }}>
      <H>{t(lang, 'apply.title')}</H>
      <Sub>{queue.length ? `${queue.length} roles past pre-confirm.` : 'Run Search first to build the queue.'}  ·  {t(lang, 'common.demo')}</Sub>
      {/* Honest scope (1.52.0): scores judge listing text vs résumé — nothing here vets the employer. */}
      <Text style={{ color: C.dim, fontSize: 11, marginBottom: 8 }}>{t(lang, 'apply.notVerified')}</Text>

      {/* Batch-score the top matches instead of tapping each — pool-bounded so winc stays responsive. */}
      {unscored > 0 ? (
        <Btn
          label={scoring ? t(lang, 'apply.scoring') : t(lang, 'apply.scoreTop', { n: Math.min(unscored, 10) })}
          disabled={scoring}
          onPress={() => scoreTopN(10)}
        />
      ) : null}
      {/* Liveness (1.53.0): re-verify scored listings against their boards — dead ones get the honest pill. */}
      {Object.keys(verdicts).length > 0 ? (
        <Btn
          label={rechecking ? t(lang, 'apply.rechecking') : t(lang, 'apply.recheck')}
          disabled={rechecking}
          onPress={() => recheckListings()}
        />
      ) : null}
      {/* Beta report (1.55.0): the shareable, PII-free session artifact. Serve-backed surfaces only —
          the on-device backend has no /report route yet. */}
      {Platform.OS === 'web' && backendMode() === 'serve' && Object.keys(verdicts).length > 0 ? (
        <Btn label={t(lang, 'apply.exportReport')} onPress={() => { exportBetaReport().catch(() => {}); }} />
      ) : null}

      {queue.map((j) => {
        const v = verdicts[j.url];
        const tl = tailored[j.url];
        return (
          <Card key={j.url}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>{j.role}</Text>
            <Text style={{ color: C.dim, marginBottom: 4 }}>{j.company} · {j.location}</Text>
            {/* Liveness (1.53.0): the board positively reported this posting gone — say so, and don't
                invite scoring a dead role. The verdict (if any) stays visible: history, not hype. */}
            {j.listingGone ? <Pill label={t(lang, 'apply.gone')} color={C.bad} text={C.bad} /> : null}

            {!v ? (
              j.listingGone ? null : <Btn label={t(lang, 'apply.score')} onPress={() => scoreOne(j.url)} />
            ) : (
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Pill label={`${t(lang, `apply.band.${v.band}`)} · ${v.score.toFixed(1)}/5`} color={bandColor(v.band)} text={bandColor(v.band)} />
                  <Pill label={`${t(lang, 'common.pay')}: ${v.pay}`} />
                  {v.clamped ? <Pill label={`clamp: ${v.clamped}`} color={C.bad} text={C.bad} /> : null}
                </View>
                {v.criteria.map((c) => (
                  <Text key={c.key} style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>
                    <Text style={{ color: c.judgment === 'strong' ? C.good : c.judgment === 'partial' ? C.warn : C.bad }}>
                      {c.judgment === 'strong' ? '●' : c.judgment === 'partial' ? '◐' : '○'} {c.key} ({Math.round(c.weight * 100)}%)
                    </Text>{'  '}{c.evidence}
                  </Text>
                ))}

                {/* The tester question (1.55.0): "Would you apply?" — a label on the ROLE. The backend
                    derives verdict-agreement from it per band (Research answers recorded, never scored),
                    and the beta report analyzes the raw answers. */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                  <Text style={{ color: C.dim, fontSize: 12, marginRight: 8 }}>{t(lang, 'apply.rate')}</Text>
                  {(['up', 'down'] as const).map((th) => {
                    const on = feedback[j.url] === th;
                    const tint = th === 'up' ? C.good : C.bad;
                    return (
                      <Pressable key={th} onPress={() => rateVerdict(j.url, th)} hitSlop={8}
                        style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginRight: 6,
                                 borderWidth: 1, borderColor: on ? tint : C.cardEdge, backgroundColor: on ? tint + '22' : 'transparent' }}>
                        <Text style={{ fontSize: 13, color: on ? tint : C.dim, opacity: on ? 1 : 0.8 }}>{t(lang, th === 'up' ? 'apply.wouldApply' : 'apply.wouldnt')}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Field
                  placeholder={t(lang, 'apply.directive')}
                  value={dir[j.url] ?? ''}
                  onChangeText={(x) => setDir((d) => ({ ...d, [j.url]: x }))}
                />
                <Btn kind="ghost" label={t(lang, 'apply.tailor')} onPress={() => tailorOne(j.url, (dir[j.url] ?? '').split(',').map((s) => s.trim()).filter(Boolean))} />

                {tl ? (
                  <View style={{ marginTop: 8, borderTopColor: C.cardEdge, borderTopWidth: 1, paddingTop: 8 }}>
                    <Text style={{ color: C.tint, fontWeight: '700', fontSize: 12, marginBottom: 4 }}>{t(lang, 'apply.summary')}</Text>
                    <Text style={{ color: C.text, fontSize: 13, lineHeight: 18 }}>{tl.summary}</Text>
                    <Text style={{ color: C.dim, fontSize: 12, marginTop: 8, lineHeight: 17 }}>{tl.coverLetter}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                      {tl.keywords.map((k) => <Pill key={k} label={k} />)}
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}
