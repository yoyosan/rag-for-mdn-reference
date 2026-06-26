"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/Header";
import { HelperText } from "@/components/settings/HelperText";
import { PasswordField } from "@/components/settings/PasswordField";
import { RecommendedModel } from "@/components/settings/RecommendedModel";
import { SignUpLink } from "@/components/settings/SignUpLink";
import { TextField } from "@/components/settings/TextField";
import { getStorageItem, setStorageItem } from "@/lib/client/localStorage";
import {
	externalAIProviderMeta,
	voyageRecommendedModels,
} from "@/lib/shared/constants";
import {
	type ExternalAIProvider,
	externalAIProviders,
} from "@/types/aiProviders";

export default function SettingsPage() {
	const [aiProvider, setAiProvider] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [aiModel, setAiModel] = useState("");
	const [voyageApiKey, setVoyageApiKey] = useState("");
	const [embedModel, setEmbedModel] = useState("");

	useEffect(() => {
		setAiProvider((getStorageItem("ai-provider") || "") as ExternalAIProvider);
		setApiKey(getStorageItem("api-key") || "");
		setAiModel(getStorageItem("ai-model") || "");
		setVoyageApiKey(getStorageItem("voyage-api-key") || "");
		setEmbedModel(getStorageItem("embed-model") || "");
	}, []);

	const handleSubmit = (formData: FormData) => {
		setStorageItem("ai-provider", formData.get("ai-provider") as string);
		setStorageItem("api-key", formData.get("api-key") as string);
		setStorageItem("ai-model", formData.get("ai-model") as string);
		setStorageItem("voyage-api-key", formData.get("voyage-api-key") as string);
		setStorageItem("embed-model", formData.get("embed-model") as string);

		toast.success("Settings saved successfully! 🎉", {
			description: "Now go back to Chat and try it out.",
		});
	};

	const handleReset = () => {
		if (!window.confirm("Are you sure you want to clear all settings?")) {
			return;
		}

		setStorageItem("ai-provider", "");
		setStorageItem("api-key", "");
		setStorageItem("ai-model", "");
		setStorageItem("voyage-api-key", "");
		setStorageItem("embed-model", "");

		setAiProvider("" as ExternalAIProvider);
		setApiKey("");
		setAiModel("");
		setVoyageApiKey("");
		setEmbedModel("");
	};

	const providerMeta = aiProvider
		? externalAIProviderMeta[aiProvider as ExternalAIProvider]
		: null;

	return (
		<div className="flex flex-col h-screen bg-gray-950 text-white">
			<SettingsHeader />
			<main className="flex flex-col flex-1 items-center gap-10 p-20">
				<div className="text-2xl">Settings</div>

				<form
					className="flex flex-col flex-1 gap-4 w-1/2"
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit(new FormData(e.currentTarget));
					}}
				>
					<div className="mb-4">
						<label
							htmlFor="ai-provider"
							className="block font-medium text-gray-300 text-lg"
						>
							AI Provider
						</label>
						<select
							id="ai-provider"
							name="ai-provider"
							className="mt-1 p-2 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
							value={aiProvider}
							onChange={(e) =>
								setAiProvider(e.target.value as ExternalAIProvider)
							}
							required
						>
							<option value="" disabled>
								Select a provider
							</option>
							{externalAIProviders.map((provider) => (
								<option key={provider} value={provider}>
									{externalAIProviderMeta[provider].label}
									{externalAIProviderMeta[provider].free
										? ` (${externalAIProviderMeta[provider].free})`
										: ""}
								</option>
							))}
						</select>
					</div>

					<PasswordField
						id="api-key"
						name="api-key"
						label="AI API Key"
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						helper={
							!apiKey && providerMeta ? (
								<HelperText>
									Don't have an API key?{" "}
									<SignUpLink
										href={providerMeta.url}
										label={`Sign up for ${providerMeta.label}`}
									/>
								</HelperText>
							) : null
						}
					/>

					<TextField
						id="ai-model"
						name="ai-model"
						label="AI Model"
						value={aiModel}
						onChange={(e) => setAiModel(e.target.value)}
						helper={
							!aiModel && providerMeta ? (
								<RecommendedModel
									model={providerMeta.recommendedModel}
									onSelect={setAiModel}
								/>
							) : null
						}
					/>

					<PasswordField
						id="voyage-api-key"
						name="voyage-api-key"
						label="Voyage API Key"
						value={voyageApiKey}
						onChange={(e) => setVoyageApiKey(e.target.value)}
						helper={
							!voyageApiKey ? (
								<HelperText>
									Don't have an API key?{" "}
									<SignUpLink
										href="https://voyageai.com/"
										label="Sign up for Voyage AI (200M tokens free)"
									/>
								</HelperText>
							) : null
						}
					/>

					<TextField
						id="embed-model"
						name="embed-model"
						label="Embedding Model"
						value={embedModel}
						onChange={(e) => setEmbedModel(e.target.value)}
						helper={
							!embedModel ? (
								<RecommendedModel
									model={voyageRecommendedModels.embedding}
									onSelect={setEmbedModel}
								/>
							) : null
						}
					/>

					<div className="mb-4 flex gap-2">
						<button
							type="submit"
							className="p-2 block w-full rounded-md border-gray-700 bg-purple-600 text-white"
						>
							Save
						</button>
						<button
							type="button"
							className="p-2 block w-full rounded-md border-gray-700 bg-red-700 text-white"
							onClick={handleReset}
						>
							Clear
						</button>
					</div>
				</form>
			</main>
		</div>
	);
}
