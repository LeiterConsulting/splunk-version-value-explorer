/* Bounded forwarder evidence. A release-line selection never certifies every patch. */
window.VersionCompassForwarderData = {
 reviewed:'2026-09-28', releases:['9.4','10.0','10.2','10.4'],
 sources:{
 upgrade100:{title:'Universal Forwarder upgrade to 10.0',url:'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first',reviewed:'2026-09-28',section:'Key points for upgrading to version 10.0'},
 upgrade102:{title:'Universal Forwarder upgrade to 10.2',url:'https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first',reviewed:'2026-09-28',section:'Key points for upgrading to version 10.2'},
 upgrade104:{title:'Forwarder and Enterprise upgrade considerations 10.4',url:'https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first',reviewed:'2026-09-28',section:'Key points; component-specific changes'},
 enterprise:{title:'Splunk Enterprise supported upgrade paths (Heavy Forwarder)',url:'https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise',reviewed:'2026-09-28',section:'Supported upgrade paths'},
 receiver:{title:'Forwarder / Enterprise indexer compatibility',url:'https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/compatibility-matrix/splunk-products-version-compatibility/compatibility-between-forwarders-and-splunk-enterprise-indexers',reviewed:'2026-09-28',section:'Determine forwarder-indexer compatibility'},
 cloud:{title:'Cloud service details: supported forwarders',url:'https://help.splunk.com/en/splunk-cloud-platform/get-started/service-terms-and-policies/10.5.2605/information-about-the-service/splunk-cloud-platform-service-details',reviewed:'2026-09-28',section:'Supported forwarder versions'},
 os:{title:'10.4 OS and architecture package matrix',url:'https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/plan-your-splunk-enterprise-installation/system-requirements-for-use-of-splunk-enterprise-on-premises',reviewed:'2026-09-28',section:'Supported Operating Systems'},
 renewal:{title:'Cloud forwarder certificate renewal prerequisites',url:'https://help.splunk.com/en/splunk-cloud-platform/forward-and-process-data/universal-forwarder-manual/10.0/configure-the-universal-forwarder/enable-a-receiver-for-the-splunk-cloud-platform',reviewed:'2026-09-28',section:'Prerequisites for using automatic TLS certificate renewal'},
 ack:{title:'10.4.2 acknowledged forwarding blockage; 10.4.3 fix',url:'https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/fixed-issues/fixed-issues/splunk-enterprise-10.4.3-fixed-issues',reviewed:'2026-09-28',section:'Important upgrade notice'},
 known:{title:'UF 10.4 known issue directory',url:'https://help.splunk.com/en/splunk-cloud-platform/forward-and-process-data/universal-forwarder-manual/10.4/release-notes/known-issues',reviewed:'2026-09-28',section:'Pointer to Universal forwarder issues in Enterprise release notes'},
 fixed:{title:'UF 10.4 fixed issue directory',url:'https://help.splunk.com/en/splunk-cloud-platform/forward-and-process-data/universal-forwarder-manual/10.4/release-notes/fixed-issues',reviewed:'2026-09-28',section:'Pointer to Universal forwarder issues in Enterprise release notes'},
 ufSecurity:{title:'UF third-party package security fixes: SVD-2026-0404',url:'https://advisory.splunk.com/advisories/SVD-2026-0404',reviewed:'2026-09-28',section:'Product Status and Solution'},
 hfSecurity:{title:'Enterprise third-party package security fixes: SVD-2026-0505',url:'https://advisory.splunk.com/advisories/SVD-2026-0505',reviewed:'2026-09-28',section:'Product Status; component-specific footnotes'},
 advisories:{title:'Splunk security advisory index',url:'https://advisory.splunk.com/',reviewed:'2026-09-28',section:'Current index; not a complete applicability audit'}
 },
 ufEdges:{'9.4':['10.0'],'10.0':['10.2','10.4'],'10.2':['10.4']},
 excludedRenewalRegions:['ap-northeast-2','ap-south-1','eu-north-1','eu-south-1','me-central-1','sa-east-1'],
 osRows:[
 ['RHEL 8','x86_64','available','available'],['RHEL 9','x86_64','available','available'],['RHEL 10','x86_64','available','available'],
 ['RHEL 8','arm64','available','unavailable'],['RHEL 9','arm64','available','unavailable'],['RHEL 10','arm64','available','unavailable'],
 ['Ubuntu 22.04','x86_64','available','available'],['Ubuntu 24.04','x86_64','available','available'],['Amazon Linux 2023','x86_64','available','available'],
 ['Windows Server 2016','x86_64','available','unavailable'],['Windows Server 2019','x86_64','available','available'],['Windows Server 2022','x86_64','available','available'],['Windows Server 2025','x86_64','available','available'],
 ['Windows 11','arm64','conditional','unavailable'],['macOS 15','arm64','available','unavailable'],['macOS 26','arm64','available','unavailable']
 ],
 hfComponents:['Python application runtime','Python runtimes','Embedded Node.js runtime','Unix service identity','Fishbucket checkpoint store','Legacy TLS protocols','Certificate signatures','KV Store binaries','KV Store database engine','KV Store TLS configuration','Windows service identity','FIPS cryptographic module']
};
