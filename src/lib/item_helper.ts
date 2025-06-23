import type { ItemRanking } from "./api";
import { ITEMS_TO_IMAGE_URLS } from "./items";

export interface ItemsToImageUrl {
    [item_name: string]: string | false;
}

export function get_item_image_url(item_name: string, items_to_image_url: ItemsToImageUrl=ITEMS_TO_IMAGE_URLS): string | false {
    if (item_name in items_to_image_url) {
        return items_to_image_url[item_name];
    }
    return false;
}

export function get_items(items_to_image_url: ItemsToImageUrl=ITEMS_TO_IMAGE_URLS): string[] {
    return Object.keys(items_to_image_url).filter(item => items_to_image_url[item] !== false);
}

export function random_pair(current_rankings: ItemRanking[], items_to_image_url: ItemsToImageUrl=ITEMS_TO_IMAGE_URLS): [string, string] {
    const items = get_items(items_to_image_url);

    // Lets make a priority system of what random pair to return based on a few factors in order of priority:
    // 1. Items that are not in the current rankings
    // 2. Items that are in the current rankings but have a low comparison count compared to others
    // 3. Items that are reasonably close together in the rankings, within a certain threshold
    // 3a. OR just a random pair for the fun of it


    // 1. Items that are not in the current rankings
    const unranked_items = items.filter(item => !current_rankings.some(ranking => ranking.item_name === item));
    if (unranked_items.length > 1) {
        console.log("Strategy: unranked items");
        const item_a = unranked_items[Math.floor(Math.random() * unranked_items.length)];
        const remaining = unranked_items.filter(item => item !== item_a);
        const item_b = remaining[Math.floor(Math.random() * remaining.length)];
        return [item_a, item_b];
    } else if (unranked_items.length === 1) {
        // Only one unranked item, pick another from the rest
        const item_a = unranked_items[0];
        const remaining = items.filter(item => item !== item_a);
        const item_b = remaining[Math.floor(Math.random() * remaining.length)];
        return [item_a, item_b];
    }

    // 2. Items with low comparison count
    const low_comparison_percentile = 0.1;
    const total_comparisons = current_rankings.reduce((acc, r) => acc + r.comparison_count, 0) || 1;
    const comparison_percentiles = current_rankings.map(ranking => ranking.comparison_count / total_comparisons);
    const low_comparison_items = items.filter(item => {
        const ranking = current_rankings.find(r => r.item_name === item);
        return ranking && comparison_percentiles[ranking.elo_ranking] < low_comparison_percentile;
    });

    if (low_comparison_items.length > 1) {
        console.log("Strategy: low comparison items");
        const item_a = low_comparison_items[Math.floor(Math.random() * low_comparison_items.length)];
        const remaining = low_comparison_items.filter(item => item !== item_a);
        const item_b = remaining[Math.floor(Math.random() * remaining.length)];
        return [item_a, item_b];
    } else if (low_comparison_items.length === 1) {
        const item_a = low_comparison_items[0];
        const remaining = items.filter(item => item !== item_a);
        const item_b = remaining[Math.floor(Math.random() * remaining.length)];
        return [item_a, item_b];
    }

    // 3. ELO range or random
    const useEloRange = Math.random() < 0.5;
    let item_a = items[Math.floor(Math.random() * items.length)];
    let item_b: string | null = null;

    if (useEloRange) {
        let elo_range = 100;
        const elo_range_expansion_factor = 1.5;
        const sorted_rankings = current_rankings.slice().sort((a, b) => a.elo_ranking - b.elo_ranking);
        while (item_b === null) {
            const item_a_ranking = sorted_rankings.find(r => r.item_name === item_a)?.elo_ranking || 0;
            const candidate_items = sorted_rankings
                .filter(ranking =>
                    ranking.item_name !== item_a &&
                    Math.abs(ranking.elo_ranking - item_a_ranking) <= elo_range
                )
                .map(r => r.item_name);

            if (candidate_items.length > 0) {
                item_b = candidate_items[Math.floor(Math.random() * candidate_items.length)];
            } else {
                elo_range *= elo_range_expansion_factor;
                if (elo_range > 1000) {
                    // fallback: pick any other item
                    const remaining = items.filter(item => item !== item_a);
                    item_b = remaining[Math.floor(Math.random() * remaining.length)];
                    break;
                }
            }
        }
    } else {
        // Just pick two random items, ensuring they are not the same
        const remaining = items.filter(item => item !== item_a);
        item_b = remaining[Math.floor(Math.random() * remaining.length)];
    }

    console.log("Strategy: elo range or random pair");
    return [item_a, item_b!];
}