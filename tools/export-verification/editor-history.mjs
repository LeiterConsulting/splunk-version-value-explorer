/* Actual two-draft browser navigation; all private-looking text is synthetic. */
import assert from 'node:assert/strict';
export async function verifyEditorHistory(p){
 const entry=p.url(),theme=await p.locator('body').getAttribute('data-theme'),a=await p.evaluate(()=>WorkflowApp.state().id);let traversals=0;
 await p.locator('[data-action="new-brief"]').click();const b=await p.evaluate(()=>WorkflowApp.state().id);assert.notEqual(a,b);
 const back=async()=>{await p.goBack();await p.waitForFunction(id=>WorkflowApp.state().id===id,a);traversals++;};
 const forward=async()=>{await p.goForward();await p.waitForFunction(id=>WorkflowApp.state().id===id,b);traversals++;};
 const emptyA=async()=>{const d=await p.evaluate(()=>WorkflowApp.state());assert.equal(d.id,a);assert.equal(d.statements.length,0);assert.equal(d.requirements.length,0);assert.equal(d.materials.length,0);};
 await p.locator('[data-action="new-source"]').click();await p.locator('#source-text').pressSequentially('PRIVATE_B_CANCELLED');const stale=await p.locator('#commit-source').elementHandle();
 await back();await emptyA();assert.equal(await p.getByRole('dialog').count(),0);
 // A queued click on a detached editor must fail the owner guard as well.
 await stale.evaluate(el=>el.click());await emptyA();await forward();await p.getByRole('dialog',{name:'Add original statement'}).waitFor();assert.equal(await p.locator('#source-text').inputValue(),'PRIVATE_B_CANCELLED');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>WorkflowApp.state().statements.length),0);
 await back();await emptyA();await forward();assert.equal(await p.getByRole('dialog').count(),0);await stale.dispose();
 await p.locator('[data-action="new-source"]').click();await p.locator('#source-text').pressSequentially('PRIVATE_B_COMMITTED');
 for(let n=0;n<2;n++){await back();await emptyA();assert.equal(await p.getByRole('dialog').count(),0);await forward();assert.equal(await p.locator('#source-text').inputValue(),'PRIVATE_B_COMMITTED');}
 await p.locator('#commit-source').click();assert.deepEqual(await p.evaluate(()=>WorkflowApp.state().statements.map(s=>s.text)),['PRIVATE_B_COMMITTED']);
 await back();await emptyA();await forward();assert.equal(await p.evaluate(()=>WorkflowApp.state().statements.length),1);
 await p.locator('[data-action="add-for-source"]').click();await p.locator('#req-title').fill('B requirement only');await p.locator('#req-criterion').fill('Compare only the named MCP minimum.');await p.locator('#map-kind').selectOption('decision');await p.locator('#map-ref').selectOption('itsi-versions');await p.locator('#map-field').selectOption('mcpVersion');await p.locator('#scope-product').selectOption('itsi');await p.locator('#scope-version').fill('5.0');
 await back();await emptyA();await forward();assert.equal(await p.locator('#req-title').inputValue(),'B requirement only');assert.equal(await p.locator('#map-kind').inputValue(),'decision');assert.equal(await p.locator('#map-field').inputValue(),'mcpVersion');await p.locator('#save-req').click();assert.equal(await p.evaluate(()=>WorkflowApp.state().requirements.length),1);
 await p.locator('[data-action="add-material"]').click();await p.locator('#material-title').fill('B material only');await p.locator('#material-quote').fill('PRIVATE_B_MATERIAL');await back();await emptyA();await forward();assert.equal(await p.locator('#material-quote').inputValue(),'PRIVATE_B_MATERIAL');await p.locator('#save-material').click();assert.equal(await p.evaluate(()=>WorkflowApp.state().materials.length),1);
 // Both drafts may hold different unfinished editors. Resume the right node and
 // handler set, then cancel B and save A without transferring either buffer.
 await p.locator('[data-action="new-source"]').click();await p.locator('#source-text').fill('PRIVATE_B_HELD');await back();await emptyA();await p.locator('[data-action="new-source"]').click();await p.locator('#source-text').fill('PRIVATE_A_COMMITTED');await forward();assert.equal(await p.locator('#source-text').inputValue(),'PRIVATE_B_HELD');await p.keyboard.press('Escape');await back();assert.equal(await p.locator('#source-text').inputValue(),'PRIVATE_A_COMMITTED');await p.locator('#commit-source').click();assert.deepEqual(await p.evaluate(()=>WorkflowApp.state().statements.map(s=>s.text)),['PRIVATE_A_COMMITTED']);
 await forward();assert.deepEqual(await p.evaluate(()=>WorkflowApp.state().statements.map(s=>s.text)),['PRIVATE_B_COMMITTED']);assert.equal(await p.evaluate(()=>WorkflowApp.model.verifyDocument(WorkflowApp.state())),true);assert.equal(await p.getByRole('dialog').count(),0);
 await back();assert.equal(await p.evaluate(()=>WorkflowApp.model.verifyDocument(WorkflowApp.state())),true);assert.equal(await p.evaluate(()=>WorkflowApp.state().requirements.length),0);assert.equal(await p.evaluate(()=>WorkflowApp.state().materials.length),0);
 await p.goto(entry);await p.waitForFunction(()=>window.__workflowReady);for(let i=0;i<3&&await p.locator('body').getAttribute('data-theme')!==theme;i++)await p.locator('#theme').click();assert.equal(await p.evaluate(()=>WorkflowApp.state().statements.length),0);
 return {passed:true,historyTraversals:traversals,sourceSaveCancel:true,requirementMapping:true,privateMaterial:true,staleDetachedSaveBlocked:true,twoHeldEditors:true,noCrossDraftText:true,auditIntegrity:true,buffers:'memory only; cleared by save/cancel or page close'};
}
