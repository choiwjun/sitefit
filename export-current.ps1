[CmdletBinding()]
param(
  [string]$CodexHome = (Join-Path $HOME ".codex")
)

$ErrorActionPreference = "Stop"

$settingsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetSkills = Join-Path $settingsRoot "skills"
$skillNames = @(
  "harness-product-orchestrator"
)

New-Item -ItemType Directory -Force -Path $targetSkills | Out-Null

foreach ($skillName in $skillNames) {
  $sourceSkill = Join-Path (Join-Path $CodexHome "skills") $skillName
  $targetSkill = Join-Path $targetSkills $skillName

  if (-not (Test-Path -LiteralPath $sourceSkill)) {
    throw "Global Codex skill not found: $sourceSkill"
  }

  New-Item -ItemType Directory -Force -Path $targetSkill | Out-Null
  Copy-Item -Path (Join-Path $sourceSkill "*") -Destination $targetSkill -Recurse -Force
  Write-Host "Exported skill: $skillName"
}

Write-Host "Portable Codex settings updated: $settingsRoot"
