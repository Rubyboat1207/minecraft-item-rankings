import { supabase } from "./supabase";

interface ComparisonSubmission {
    item_id: string;
    comparison_item_id: string;
    item_is_more_rare: boolean;
    user_id?: string;
}

export async function submit_comparison({
    item_id,
    comparison_item_id,
    item_is_more_rare,
    user_id
}: ComparisonSubmission) {
    await supabase.from('RarityComparison')
        .insert([
            { 
                item_id,
                comparison_id: comparison_item_id,
                is_more_rare: item_is_more_rare,
                user_id: user_id || (await supabase.auth.getSession()).data.session?.user.id|| null,
            },
        ])
}

export interface ItemRanking {
    elo_ranking: number;
    comparison_count: number;
    item_name: string;
    last_updated: string;
}

export async function get_item_elos(): Promise<ItemRanking[]> {
    return (await supabase
        .from('ItemRankings')
        .select('*')
        .order('elo_ranking', { ascending: false }))
        .data || [];
}