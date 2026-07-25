// Artifact Envelope — every artifact carries its full metadata envelope.
//
// authenticity + constitutionAlignment + confidence + provenance + sources +
// identityVersion + modelVersion + generatedBy
//
// This makes authenticity a pervasive platform service: every capability,
// extension, connector, and workflow can invoke it. Every extension
// automatically participates.

import { db } from "@/lib/db";
import { jstr, jparseArr } from "@/lib/json";
import type { ArtifactEnvelopeRecord } from "@/lib/types";
import { checkTrust } from "./trust-engine";

export interface EnvelopeInput {
  artifactType: string;
  artifactRef?: string;
  content: string;
  projectId?: string;
  generatedBy: string; // creator | agent:<type> | extension:<id> | capability:<key>
  identityVersion?: string;
  modelVersion?: string;
  declaredSources?: { type: string; url?: string; reliability?: number }[];
  creatorConfidence?: number;
}

// Create an envelope for an artifact: runs authenticity + constitution + trust,
// then persists the full envelope. This is the pervasive authenticity service.
export async function createEnvelope(input: EnvelopeInput): Promise<ArtifactEnvelopeRecord & { trust: any }> {
  // Run the trust check (which internally runs authenticity + constitution)
  const trust = await checkTrust({
    artifactType: input.artifactType,
    content: input.content,
    projectId: input.projectId,
    artifactRef: input.artifactRef,
    declaredSources: input.declaredSources,
    creatorConfidence: input.creatorConfidence,
  });

  // Build provenance chain (simplified — in production this would trace the full pipeline)
  const provenance = [{
    step: input.artifactType,
    capability: input.generatedBy,
    timestamp: new Date().toISOString(),
  }];

  const envelope = await db.artifactEnvelope.create({
    data: {
      projectId: input.projectId ?? null,
      artifactType: input.artifactType,
      artifactRef: input.artifactRef ?? null,
      authenticityScore: trust.authenticityScore,
      constitutionAlignment: trust.constitutionAlignment,
      confidence: trust.trustScore / 100,
      provenance: jstr(provenance),
      sources: jstr(trust.sources),
      identityVersion: input.identityVersion ?? null,
      modelVersion: input.modelVersion ?? null,
      generatedBy: input.generatedBy,
      trustProfileId: trust.trustProfileId,
    },
  });

  return { ...decode(envelope), trust };
}

// Get an envelope by id
export async function getEnvelope(id: string): Promise<ArtifactEnvelopeRecord | null> {
  const row = await db.artifactEnvelope.findUnique({ where: { id } });
  return row ? decode(row) : null;
}

// List envelopes
export async function listEnvelopes(projectId?: string, limit = 50): Promise<ArtifactEnvelopeRecord[]> {
  const where = projectId ? { projectId } : {};
  const rows = await db.artifactEnvelope.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(decode);
}

// Get the envelope for a specific artifact (by type + ref)
export async function getEnvelopeForArtifact(artifactType: string, artifactRef: string): Promise<ArtifactEnvelopeRecord | null> {
  const row = await db.artifactEnvelope.findFirst({
    where: { artifactType, artifactRef },
    orderBy: { createdAt: "desc" },
  });
  return row ? decode(row) : null;
}

function decode(r: any): ArtifactEnvelopeRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    artifactType: r.artifactType,
    artifactRef: r.artifactRef,
    authenticityScore: r.authenticityScore,
    constitutionAlignment: r.constitutionAlignment,
    confidence: r.confidence,
    provenance: jparseArr(r.provenance),
    sources: jparseArr(r.sources),
    identityVersion: r.identityVersion,
    modelVersion: r.modelVersion,
    generatedBy: r.generatedBy,
    trustProfileId: r.trustProfileId,
    createdAt: r.createdAt.toISOString(),
  };
}
