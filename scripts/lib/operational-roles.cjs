/* Detection contract, separate from the immutable content-coverage registries. */
module.exports = {
  contractVersion: '1.0.0',
  roles: [
    { roleId: 'github-steward', taskId: '6aef2ecb4e148191b0650b1c8111b041', reportAliases: ['Maintain VersionCompass GitHub'], configuration: null },
    { roleId: 'operational-auditor', taskId: '6aef2ee75b348191b992523a78823fe7', reportAliases: ['Audit VersionCompass and Ripple'], configuration: null },
    { roleId: 'ripple-refresh', taskId: 'Automation_9e515257fc608191b6ed1f59aa9d26ef', reportAliases: ['Refresh Ripple exposure intelligence'], configuration: null }
  ],
  optionalTasks: [
    { taskId: '6ab7238cd46c81918929c75da7256685', roleId: 'expired-checkpoint' },
    { taskId: '6ae3a9edc19081918d4a04fc59572062', roleId: 'november-20-review' }
  ]
};
