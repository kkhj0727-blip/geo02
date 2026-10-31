import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, DEFAULTS } from '../model.js';
test('사라진 갯벌을 보호 노력만으로 대체할 수 없다',()=>{
  assert.deepEqual(calculate({area:0,pollution:0,protection:100}),{habitat:0,birds:0,purification:0});
});
test('한 조건씩 통제하면 면적 감소와 오염 증가는 각 지수를 낮춘다',()=>{
  const base=calculate(DEFAULTS);
  for(const changed of [{...DEFAULTS,area:40},{...DEFAULTS,pollution:80}]){
    const result=calculate(changed);
    for(const key of Object.keys(base)) assert.ok(result[key]<base[key]);
  }
});
test('보호는 서식 여건에 작용하며 정화 지수에는 중복 반영하지 않는다',()=>{
  const low=calculate({...DEFAULTS,protection:0}),high=calculate({...DEFAULTS,protection:100});
  assert.ok(high.habitat>low.habitat);assert.ok(high.birds>low.birds);assert.equal(high.purification,low.purification);
});
test('전체 입력 범위에서 모든 지수가 유한하고 0~100 사이이다',()=>{
  for(let area=0;area<=100;area+=5)for(let pollution=0;pollution<=100;pollution+=5)for(let protection=0;protection<=100;protection+=10){
    for(const n of Object.values(calculate({area,pollution,protection})))assert.ok(Number.isFinite(n)&&n>=0&&n<=100);
  }
});
