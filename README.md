Here is the complete card list with their types and categories, extracted directly from the `CARD_SORT_ORDER` array. The card_id format is `{category}_{name}_{type}`.

## Evolving Universe (EU)
| Card ID | Name | Type |
|---------|------|------|
| EU_evacuation_master_golden | Evacuation Master | Golden |
| EU_melody_strongest_team_golden | Melody Strongest Team | Golden |
| EU_raging_rush_strongest_team_golden | Raging Rush Strongest Team | Golden |
| EU_music_hall_silver | Music Hall | Silver |
| EU_racing_hall_silver | Racing Hall | Silver |
| EU_dynamic_slide_hall_silver | Dynamic Slide Hall | Silver |
| EU_rail_parachute_challenge_silver | Rail Parachute Challenge | Silver |
| EU_racing_challenge_silver | Racing Challenge | Silver |
| EU_s_rank_vault_silver | S-Rank Vault | Silver |
| EU_a_rank_vault_basic | A-Rank Vault | Basic |
| EU_b_rank_vault_basic | B-Rank Vault | Basic |
| EU_anniversary_lucky_spin_basic | Anniversary Lucky Spin | Basic |
| EU_energy_shield_basic | Energy Shield | Basic |
| EU_spatial_distribution_zone_1_basic | Spatial Distribution Zone 1 | Basic |
| EU_spatial_distribution_zone_2_basic | Spatial Distribution Zone 2 | Basic |
| EU_floating_thruster_basic | Floating Thruster | Basic |

## Jujutsu Kaisen (JK)
| Card ID | Name | Type |
|---------|------|------|
| JK_jujutsu_kaisen_golden | Jujutsu Kaisen | Golden |
| JK_ryomen_sukuna_golden | Ryomen Sukuna | Golden |
| JK_suguru_geto_golden | Suguru Geto | Golden |
| JK_sataro_gojo_silver | Sataro Gojo | Silver |
| JK_yuji_itadori_silver | Yuji Itadori | Silver |
| JK_megumi_fushigoro_silver | Megumi Fushigoro | Silver |
| JK_nue_silver | Nue | Silver |
| JK_nobara_kugisaki_silver | Nobara Kugisaki | Silver |
| JK_cathy_basic | Cathy | Basic |
| JK_cursed_corpse_spear_basic | Cursed Corpse Spear | Basic |
| JK_inverted_spear_of_heaven_basic | Inverted Spear of Heaven | Basic |

## Anniversary 2025 (ANN)
| Card ID | Name | Type |
|---------|------|------|
| ANN_legendary_journey_golden | Legendary Journey | Golden |
| ANN_elite_collector_golden | Elite Collector | Golden |
| ANN_golden_age_silver | Golden Age | Silver |
| ANN_arcade_time_silver | Arcade Time | Silver |
| ANN_rhythm_hero_silver | Rhythm Hero | Silver |
| ANN_vibrant_world_silver | Vibrant World | Silver |
| ANN_dino_ground_silver | Dino Ground | Silver |
| ANN_ocean_odyssey_silver | Ocean Odyssey | Silver |
| ANN_golden_dynasty_silver | Golden Dynasty | Silver |
| ANN_temporal_vault_silver | Temporal Vault | Silver |

## PMGC (PMG)
| Card ID | Name | Type |
|---------|------|------|
| PMG_champion_a7_golden | Champion A7 | Golden |
| PMG_bangkok_thailand_golden | Bangkok Thailand | Golden |
| PMG_fmvp_apg_top_golden | FMVP APG Top | Golden |
| PMG_2nd_place_ulf_golden | 2nd Place ULF | Golden |
| PMG_3rd_place_apg_golden | 3rd Place APG | Golden |
| PMG_tt_silver | TT | Silver |
| PMG_dk_silver | DK | Silver |
| PMG_drx_silver | DRX | Silver |
| PMG_dk_r_silver | DK R | Silver |
| PMG_ae_silver | AE | Silver |
| PMG_ae_rosemary_silver | AE Rosemary | Silver |
| PMG_r8_amoori_silver | R8 Amoori | Silver |
| PMG_kara_ceo_silver | Kara CEO | Silver |
| PMG_ulf_kecth_silver | ULF Kecth | Silver |
| PMG_goat_basic | GOAT | Basic |
| PMG_reg_basic | REG | Basic |
| PMG_mad_basic | MAD | Basic |
| PMG_ea_basic | EA | Basic |
| PMG_r8_basic | R8 | Basic |
| PMG_kara_basic | Kara | Basic |
| PMG_vpe_basic | VPE | Basic |
| PMG_fl_basic | FL | Basic |

## Playful Background (PB)
| Card ID | Name | Type |
|---------|------|------|
| PB_mrbeast_golden | MrBeast | Golden |
| PB_ray_silver | Ray | Silver |
| PB_garand_basic | Garand | Basic |
| PB_tracked_amphicarrier_basic | Tracked Amphicarrier | Basic |

---

## Updated Testing Guide

### Step 1: Test User Setup (4 Users)

| User | Cards to Give | Purpose |
|------|---------------|---------|
| **User A** (Creator) | 2x **Music Hall** (Silver) | Will create a trade offering `Music Hall` for `Racing Hall` |
| **User B** (Copier 1) | 2x **Racing Hall** (Silver) | Has matching Silver card → can successfully copy |
| **User C** (Copier 2) | 2x **Golden Dynasty** (Silver) | Has Silver card → will be the second copier |
| **User D** (No Match) | 2x **A-Rank Vault** (Basic) | Has NO Silver cards → should get "no match" error |

### Step 2: Create a Code Trade (User A)
1. Log in as **User A**.
2. Go to **Code Trades** tab.
3. Click **Create Trade** → Select `Racing Hall` (Wants) → Select `Music Hall` (Offers) → Enter code `12345678` → 5 days → Create.

### Step 3: Browse & Copy - Success (User B)
1. Log in as **User B**.
2. Go to **Code Trades** → Toggle to **Relevant** → User A's trade should appear.
3. Click **Copy Code** → Popup shows trade details → Click **Copy Code**.
4. Toast: "Code copied! Trade added to your outgoing trades."
5. Check **My Trades** → Should see "Code Exchange: User A" as `PENDING`.

### Step 4: Browse & Copy - No Match (User D)
1. Log in as **User D**.
2. Go to **Code Trades** → Toggle to **Relevant** → Should be **empty**.
3. Toggle to **All** → User A's trade appears.
4. Click **Copy Code** → Error: "You do not have any Silver cards to offer for this trade."

### Step 5: Confirmation Flow (User B)
1. Refresh app as **User B** → Popup: "Code Exchange" with card images.
2. Click **"Yes, Trade Successful"**.
3. Check **Collection**: User B should now have `Racing Hall` and lost one `Music Hall`.
4. Log in as **User A**: Should now have 3x `Music Hall` and 0x `Racing Hall`.

### Step 6: Multiple Copies & "Exchanged by Other" (User C)
1. Create a new trade as **User A** (Code: `87654321`).
2. Have **User B** copy it (don't confirm).
3. Have **User C** copy it.
4. Have **User B** confirm "Yes".
5. Log in as **User C** → Refresh → Should show `EXCHANGED BY OTHER`.

### Step 7: Failure Reporting
1. Create another trade as **User A**.
2. Have **User B** copy it → Refresh → Click **"No, Had Issues"** → Select reason.
3. Check **My Trades**: Should show `FAILED` with reason.

Run through these steps and tell me the results at each step.
