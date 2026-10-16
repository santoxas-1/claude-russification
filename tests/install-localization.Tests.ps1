# Run with Windows PowerShell 5.1: Invoke-Pester ./tests/install-localization.Tests.ps1
$project = Split-Path $PSScriptRoot -Parent
. (Join-Path $project 'scripts/install-localization.ps1')

Describe 'Resource-only localization installer' {
    BeforeEach {
        $script:fixture = Join-Path $PSScriptRoot ('temp/localization-' + [guid]::NewGuid().ToString('N'))
        $script:app = Join-Path $fixture 'app'
        $script:dist = Join-Path $fixture 'dist'
        $script:backups = Join-Path $fixture 'backups'
        foreach ($dir in @('app/resources/ion-dist/i18n/dynamic','dist/dynamic')) {
            [IO.Directory]::CreateDirectory((Join-Path $fixture $dir)) | Out-Null
        }
        [IO.File]::WriteAllText((Join-Path $app 'claude.exe'), 'fake executable; version is mocked')
        [IO.File]::WriteAllText((Join-Path $app 'resources/ion-dist/index.html'), '<html><head></head><body>Original</body></html>')
        foreach ($file in @('resources/ion-dist/i18n/en-US.json','resources/ion-dist/i18n/dynamic/en-US.json','resources/en-US.json')) {
            [IO.File]::WriteAllText((Join-Path $app $file), '{"original":true}')
        }
        foreach ($file in @('en-US.json','dynamic/en-US.json','native-en-US.json')) {
            [IO.File]::WriteAllText((Join-Path $dist $file), '{"translated":true}')
        }
        [IO.File]::WriteAllText((Join-Path $dist 'i18n-ru.js'), 'window.localized = true;')
        [IO.File]::WriteAllText((Join-Path $app 'untouched.txt'), 'keep me')
        $script:argsForInstall = @{AppPath=$app; DistPath=$dist; ExpectedVersion='1.2.3'; ExpectedExeSha256=(Get-LocalizationHash (Join-Path $app 'claude.exe')); BackupRoot=$backups}
        Mock Get-LocalizationVersion { '1.2.3' }
        Mock Get-CimInstance { @() }
        $script:before = @(Get-ChildItem -LiteralPath $fixture -Recurse -File | ForEach-Object { $_.FullName + ':' + (Get-LocalizationHash $_.FullName) }) -join "`n"
    }
    AfterEach {
        if (Test-Path -LiteralPath $fixture) { Remove-Item -LiteralPath $fixture -Recurse -Force }
    }
    It 'plans dry-run without adding or modifying any file or backup directory' {
        $plan = Install-Localization @argsForInstall -DryRun
        $plan.Status | Should Be 'Planned'
        $plan.Files.Count | Should Be 5
        (Test-Path $backups) | Should Be $false
        $after = @(Get-ChildItem -LiteralPath $fixture -Recurse -File | ForEach-Object { $_.FullName + ':' + (Get-LocalizationHash $_.FullName) }) -join "`n"
        $after | Should Be $before
    }
    It 'supports WhatIf without writes' {
        $plan = Install-Localization @argsForInstall -WhatIf
        $plan.Status | Should Be 'Planned'
        (Test-Path $backups) | Should Be $false
        $after = @(Get-ChildItem -LiteralPath $fixture -Recurse -File | ForEach-Object { $_.FullName + ':' + (Get-LocalizationHash $_.FullName) }) -join "`n"
        $after | Should Be $before
    }
    It 'copies exactly the allowed resources and creates verified backups' {
        $plan = Install-Localization @argsForInstall -Confirm:$false
        $plan.Status | Should Be 'Installed'
        (Get-ChildItem -LiteralPath $plan.BackupPath -Filter '*.original').Count | Should Be 4
        foreach ($file in $plan.Files) { (Get-LocalizationHash $file.Target) | Should Be $file.After }
        [IO.File]::ReadAllText((Join-Path $app 'untouched.txt')) | Should Be 'keep me'
        [IO.File]::ReadAllText((Join-Path $app 'resources/ion-dist/index.html')) | Should Match '<head><script src="/i18n-ru.js"></script>'
    }
    It 'does not duplicate an injection on a second installation' {
        $null = Install-Localization @argsForInstall -Confirm:$false
        $null = Install-Localization @argsForInstall -Confirm:$false
        ([regex]::Matches([IO.File]::ReadAllText((Join-Path $app 'resources/ion-dist/index.html')), 'i18n-ru.js')).Count | Should Be 1
    }
    It 'refuses a running application without creating backups' {
        Mock Get-CimInstance { @([pscustomobject]@{Name='claude.exe'; ExecutablePath=(Join-Path $script:app 'claude.exe'); ProcessId=123}) }
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        (Test-Path $backups) | Should Be $false
        Assert-MockCalled Get-CimInstance -Times 1 -Exactly -Scope It
    }
    It 'refuses unknown executable paths and process inventory failures' {
        Mock Get-CimInstance { @([pscustomobject]@{Name='claude.exe'; ExecutablePath=$null; ProcessId=123}) }
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        Mock Get-CimInstance { throw 'inventory denied' }
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        (Test-Path $backups) | Should Be $false
    }
    It 'refuses a wrong version and executable hash' {
        $argsForInstall.ExpectedVersion='wrong'
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        $argsForInstall.ExpectedVersion='1.2.3'
        $argsForInstall.ExpectedExeSha256='0' * 64
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        (Test-Path $backups) | Should Be $false
    }
    It 'rejects missing and malformed resources before writing' {
        [IO.File]::WriteAllText((Join-Path $dist 'en-US.json'), '{broken')
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        [IO.File]::Delete((Join-Path $dist 'i18n-ru.js'))
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        (Test-Path $backups) | Should Be $false
    }
    It 'rolls back a mid-install failure including newly created files' {
        $script:moveCount=0
        Mock Move-LocalizationFile {
            param($Source,$Target)
            $script:moveCount++
            if ($script:moveCount -eq 3) { throw 'simulated disk failure' }
            [IO.File]::Copy($Source,$Target,$true)
            [IO.File]::Delete($Source)
        }
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw 'RolledBack'
        $after = @(Get-ChildItem -LiteralPath $app -Recurse -File | ForEach-Object { $_.FullName + ':' + (Get-LocalizationHash $_.FullName) }) -join "`n"
        $expected = @(($before -split "`n") | Where-Object { $_.StartsWith($app) }) -join "`n"
        $after | Should Be $expected
        $manifest = Get-ChildItem -LiteralPath $backups -Recurse -Filter manifest.json
        ([IO.File]::ReadAllText($manifest.FullName) | ConvertFrom-Json).Status | Should Be 'RolledBack'
    }
    It 'rolls back if the app starts during installation' {
        $script:inventoryCalls=0
        Mock Get-CimInstance {
            $script:inventoryCalls++
            if ($script:inventoryCalls -ge 5) { @([pscustomobject]@{Name='claude.exe'; ExecutablePath=(Join-Path $script:app 'claude.exe'); ProcessId=123}) }
        }
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw 'RolledBack'
        (Test-Path (Join-Path $app 'resources/ion-dist/i18n-ru.js')) | Should Be $false
    }
    It 'restores all five files when the final replacement fails after writing' {
        [IO.File]::WriteAllText((Join-Path $app 'resources/ion-dist/i18n-ru.js'), 'original script')
        $originals = @{}
        Get-ChildItem -LiteralPath $app -Recurse -File | ForEach-Object { $originals[$_.FullName] = Get-LocalizationHash $_.FullName }
        $script:moveCount=0
        Mock Move-LocalizationFile {
            param($Source,$Target)
            [IO.File]::Copy($Source,$Target,$true)
            $script:moveCount++
            if ($script:moveCount -eq 5) { throw 'failure after final write' }
        }
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw 'RolledBack'
        foreach ($path in $originals.Keys) { (Get-LocalizationHash $path) | Should Be $originals[$path] }
    }
    It 'removes directories created during a failed installation' {
        Remove-Item -LiteralPath (Join-Path $app 'resources/ion-dist/i18n') -Recurse -Force
        $script:moveCount=0
        Mock Move-LocalizationFile {
            param($Source,$Target)
            $script:moveCount++
            if ($script:moveCount -eq 4) { throw 'failure after creating nested directories' }
            [IO.File]::Copy($Source,$Target,$true)
        }
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw 'RolledBack'
        (Test-Path (Join-Path $app 'resources/ion-dist/i18n')) | Should Be $false
        (Test-Path (Join-Path $app 'resources/ion-dist/i18n-ru.js')) | Should Be $false
    }
    It 'rejects a junction before writing' {
        $junction = Join-Path $fixture 'linked-app'
        $null = New-Item -ItemType Junction -Path $junction -Target $app
        try {
            $argsForInstall.AppPath=$junction
            { Install-Localization @argsForInstall -DryRun } | Should Throw 'Reparse'
            (Test-Path $backups) | Should Be $false
        } finally {
            [IO.Directory]::Delete($junction)
        }
    }
    It 'preserves a UTF-8 BOM byte for byte except the injection' {
        $htmlPath=Join-Path $app 'resources/ion-dist/index.html'
        $encoding=New-Object Text.UTF8Encoding($true)
        [byte[]]$original=$encoding.GetPreamble() + $encoding.GetBytes('<html><head></head></html>')
        [IO.File]::WriteAllBytes($htmlPath,$original)
        $null=Install-Localization @argsForInstall -Confirm:$false
        $actual=[IO.File]::ReadAllBytes($htmlPath)
        [BitConverter]::ToString($actual[0..2]) | Should Be 'EF-BB-BF'
        $text=(New-Object Text.UTF8Encoding($false,$true)).GetString($actual).Replace('<script src="/i18n-ru.js"></script>','')
        [BitConverter]::ToString([Text.Encoding]::UTF8.GetBytes($text)) | Should Be ([BitConverter]::ToString($original))
    }
    It 'restores a successful installation and supports a write-free restore plan' {
        $originals=@{}
        Get-ChildItem -LiteralPath $app -Recurse -File | ForEach-Object { $originals[$_.FullName]=Get-LocalizationHash $_.FullName }
        $plan=Install-Localization @argsForInstall -Confirm:$false
        $installed=@(Get-ChildItem -LiteralPath $fixture -Recurse -File | ForEach-Object { $_.FullName+':'+(Get-LocalizationHash $_.FullName) }) -join "`n"
        (Restore-Localization -BackupPath $plan.BackupPath -DryRun).Status | Should Be 'RestorePlanned'
        (Restore-Localization -BackupPath $plan.BackupPath -WhatIf).Status | Should Be 'RestorePlanned'
        $afterPlan=@(Get-ChildItem -LiteralPath $fixture -Recurse -File | ForEach-Object { $_.FullName+':'+(Get-LocalizationHash $_.FullName) }) -join "`n"
        $afterPlan | Should Be $installed
        (Restore-Localization -BackupPath $plan.BackupPath -Confirm:$false).Status | Should Be 'Restored'
        foreach ($path in $originals.Keys) { (Get-LocalizationHash $path) | Should Be $originals[$path] }
        (Test-Path (Join-Path $app 'resources/ion-dist/i18n-ru.js')) | Should Be $false
    }
    It 'refuses restore while running or after an installed file changed' {
        $plan=Install-Localization @argsForInstall -Confirm:$false
        Mock Get-CimInstance { @([pscustomobject]@{Name='claude.exe'; ExecutablePath=(Join-Path $script:app 'claude.exe'); ProcessId=123}) }
        { Restore-Localization -BackupPath $plan.BackupPath -Confirm:$false } | Should Throw 'running'
        Mock Get-CimInstance { @() }
        [IO.File]::WriteAllText((Join-Path $app 'resources/ion-dist/i18n-ru.js'),'external change')
        { Restore-Localization -BackupPath $plan.BackupPath -Confirm:$false } | Should Throw 'changed'
    }
    It 'refuses restore if a backup or installed file was changed' {
        $plan=Install-Localization @argsForInstall -Confirm:$false
        [IO.File]::WriteAllText((Join-Path $plan.BackupPath '1.original'),'tampered')
        { Restore-Localization -BackupPath $plan.BackupPath -Confirm:$false } | Should Throw 'hash mismatch'
    }
    It 'rejects a backup inside the app and malformed HTML' {
        $argsForInstall.BackupRoot=Join-Path $app 'backup'
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        $argsForInstall.BackupRoot=$backups
        [IO.File]::WriteAllText((Join-Path $app 'resources/ion-dist/index.html'), '<html>no head</html>')
        { Install-Localization @argsForInstall -Confirm:$false } | Should Throw
        (Test-Path $backups) | Should Be $false
    }
}
