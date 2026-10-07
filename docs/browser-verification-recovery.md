# Browser verification recovery

Record the failing operation and its actual error before choosing a repair. Browser-service timeouts, page navigation failures, restricted file URLs and absent viewport/PDF capabilities are different conditions. Do not turn any of them into passed report verification or infer a site crash from a missing response.

1. Check the supported browser inventory once. If it responds, bind a current tab and repeat the exact failed navigation once. Verify the visible page and required interaction. Do not repeatedly reset or retry an unavailable service.
2. For Sites preview, follow the installed Sites skill's supported preview/browser workflow. Do not install a substitute browser, change working site code or relax security settings to compensate for missing managed capabilities.
3. Run the live delivery diagnostic from the source matching the deployed revision. Preserve each result independently. It now reports running/completed checks, request-level unavailability as blocked, and returned verification failures as failed. Neither is a pass. Correlate the method/path and time with Worker logs; expected 400/405 rejections are successful guard checks, not application crashes.
4. Resume only checks the current surface supports. Navigation recovery does not establish native PDF generation, downloaded-HTML rendering, viewport emulation or a changed candidate's report parity. Accept existing owner-reported verification within its recorded scope; do not reopen those baseline blockers or generalize them to future content/runtime changes.
5. Keep a content candidate held until its applicable affected-report checks pass. Preserve the deployed complete revision, privacy, public audience and rollback boundary. A missing browser does not start a mandatory waiting period or justify duplicate timers. Keep established maintenance schedules.

The October 7 diagnostic recovery is recorded in [the audit](audits/2026-10-07-browser-recovery.json). It identifies observations and remaining unknowns separately; the internal cause of the earlier browser-service timeout is not available in the application logs.
