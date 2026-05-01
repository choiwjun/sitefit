[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$CodexHome = (Join-Path $HOME ".codex"),
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$settingsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceSkills = Join-Path $settingsRoot "skills"
$targetSkills = Join-Path $CodexHome "skills"
$backupRoot = Join-Path $CodexHome "skill-backups"

if (-not (Test-Path -LiteralPath $sourceSkills)) {
  throw "Source skills folder not found: $sourceSkills"
}

New-Item -ItemType Directory -Force -Path $targetSkills | Out-Null

$installed = @()

Get-ChildItem -LiteralPath $sourceSkills -Directory | ForEach-Object {
  $sourceSkill = $_.FullName
  $skillName = $_.Name
  $targetSkill = Join-Path $targetSkills $skillName

  if ((Test-Path -LiteralPath $targetSkill) -and -not $Force) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupSkill = Join-Path $backupRoot "$skillName-$stamp"
    New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

    if ($PSCmdlet.ShouldProcess($targetSkill, "Back up to $backupSkill")) {
      Copy-Item -LiteralPath $targetSkill -Destination $backupSkill -Recurse -Force
    }
  }

  New-Item -ItemType Directory -Force -Path $targetSkill | Out-Null

  if ($PSCmdlet.ShouldProcess($targetSkill, "Install skill $skillName")) {
    Copy-Item -Path (Join-Path $sourceSkill "*") -Destination $targetSkill -Recurse -Force
    $installed += $skillName
  }
}

Write-Host "Installed Codex skills into: $targetSkills"
$installed | ForEach-Object { Write-Host "- $_" }
