export const CLUSTER_MAP = {
  0: {
    label: "Cluster 0",
    summary: "tar diisi tim ML",
    strengths: ["nganu"],
    risks: ["nganu"],
    tips: ["nganu"],
  },
  1: {
    label: "Cluster 1",
    summary: "tar diisi tim ML",
    strengths: ["nganu"],
    risks: ["nganu"],
    tips: ["nganu"],
  },
  2: {
    label: "Cluster 2",
    summary: "tar diisi tim ML",
    strengths: ["nganu"],
    risks: ["nganu"],
    tips: ["nganu"],
  },
};

export const getClusterInfo = (clusterId) => {
  const key = Number(clusterId);
  return CLUSTER_MAP[key] || {
    label: `Unknown cluster (${clusterId})`,
    summary: "Belum ada definisi cluster ini.",
    strengths: [],
    risks: [],
    tips: [],
  };
};