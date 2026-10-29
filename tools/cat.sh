#!/bin/sh
cd "$(dirname "$0")/.."
{
cat <<'H'
// Fronts de France — version web (three.js). Généré depuis parts/ par tools/cat.sh
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
H
cat parts/10_engine.js parts/20_chars.js parts/30_levels.js parts/40_game.js
echo 'if(import.meta.env.DEV) window.__eval=s=>eval(s);'
} > src/main.js
