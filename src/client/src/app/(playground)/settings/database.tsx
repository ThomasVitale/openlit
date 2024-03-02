import SideTabs, { SideTabItemProps } from "@/components/common/side-tabs";
import { DB_META_KEYS } from "@/constants/dbConfig";
import useFetchWrapper from "@/utils/hooks/useFetchWrapper";
import { noop } from "@/utils/noop";
import { CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { keyBy } from "lodash";
import {
	FormEventHandler,
	MouseEventHandler,
	useCallback,
	useEffect,
	useState,
} from "react";
import toast from "react-hot-toast";

type DBConfig = {
	id: string;
	name: string;
	environment: string;
	meta: Record<string, any>;
	isCurrent?: boolean;
};

function ModifyDatabaseConfig({
	dbConfig,
	successCb,
}: {
	dbConfig?: DBConfig;
	successCb: () => void;
}) {
	const { fireRequest, isLoading } = useFetchWrapper();

	const modifyDetails: FormEventHandler<HTMLFormElement> = useCallback(
		(event) => {
			event.preventDefault();
			const formElement = event.target as HTMLFormElement;

			toast.loading("Modifying db config...", {
				id: "db-config-details",
			});

			fireRequest({
				body: JSON.stringify({
					id: dbConfig?.id,
					name: (formElement.name as any)?.value,
					environment: (formElement.environment as any)?.value,
					meta: {
						[DB_META_KEYS.url]: (formElement[DB_META_KEYS.url] as any)?.value,
					},
				}),
				requestType: "POST",
				url: "/api/db-config",
				responseDataKey: "data",
				successCb: () => {
					successCb();
					toast.success("Db config updated!", {
						id: "db-config-details",
					});
					if (!dbConfig?.id) formElement.reset();
				},
				failureCb: (err?: string) => {
					toast.error(err || "Db config updation failed!", {
						id: "db-config-details",
					});
				},
			});
		},
		[dbConfig?.id]
	);

	return (
		<form
			className="flex flex-col w-full"
			onSubmit={isLoading ? noop : modifyDetails}
		>
			<div className="flex flex-col relative flex-1 overflow-y-auto px-5 py-3">
				<h2 className="text-base font-semibold text-tertiary sticky top-0 bg-white">
					{dbConfig?.id ? "Update" : "Add"} database config
				</h2>

				<div className="flex flex-col mt-6 w-full">
					<div className="flex flex-1 items-center">
						<label
							htmlFor="name"
							className="text-tertiary/[0.8] text-sm font-normal w-1/5"
						>
							Config Name
						</label>
						<div className="flex w-2/3 shadow-sm ring-1 ring-inset ring-gray-300">
							<input
								key={`${dbConfig?.id}-name`}
								type="text"
								name="name"
								id="name"
								className="flex-1 border border-tertiary/[0.2] py-1.5 px-2 text-tertiary placeholder:text-tertiary/[0.4] outline-none focus:ring-0 text-sm"
								placeholder="db-config"
								defaultValue={dbConfig?.name}
							/>
						</div>
					</div>
				</div>

				<div className="flex flex-col mt-6 w-full">
					<div className="flex flex-1 items-center">
						<label
							htmlFor="environment"
							className="text-tertiary/[0.8] text-sm font-normal w-1/5"
						>
							Environment
						</label>
						<div className="flex w-2/3 shadow-sm ring-1 ring-inset ring-gray-300">
							<input
								key={`${dbConfig?.id}-environment`}
								type="text"
								name="environment"
								id="environment"
								className="flex-1 border border-tertiary/[0.2] py-1.5 px-2 text-tertiary placeholder:text-tertiary/[0.4] outline-none focus:ring-0 text-sm"
								placeholder="production"
								defaultValue={dbConfig?.environment}
							/>
						</div>
					</div>
				</div>

				<div className="flex flex-col mt-6 w-full">
					<div className="flex flex-1 items-center">
						<label
							htmlFor={DB_META_KEYS.url}
							className="text-tertiary/[0.8] text-sm font-normal w-1/5"
						>
							Clickhouse Database url
						</label>
						<div className="flex w-2/3 shadow-sm ring-1 ring-inset ring-gray-300">
							<input
								key={`${dbConfig?.id}-${DB_META_KEYS.url}`}
								type="text"
								name={DB_META_KEYS.url}
								id={DB_META_KEYS.url}
								className="flex-1 border border-tertiary/[0.2] py-1.5 px-2 text-tertiary placeholder:text-tertiary/[0.4] outline-none focus:ring-0 text-sm"
								placeholder="clickhouse://<user>:<password>@<host>:<port>/<database>[? key=value..]"
								defaultValue={dbConfig?.meta[DB_META_KEYS.url]}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-end border-t border-secondary w-full py-2 gap-3">
				<button
					type="submit"
					className={`rounded-sm bg-primary/[0.9] px-5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary focus-visible:outline ${
						isLoading ? "animate-pulse" : ""
					}`}
				>
					{dbConfig?.id ? "Update" : "Save"}
				</button>
			</div>
		</form>
	);
}

const ADD_NEW_ID = "ADD_NEW_ID";

function DatabaseList({
	dbConfigs,
	successCb,
	isLoadingList,
}: {
	dbConfigs: DBConfig[];
	successCb: () => void;
	isLoadingList: boolean;
}) {
	const { fireRequest, isLoading } = useFetchWrapper();
	const [selectedDBConfigId, setSelectedDBConfigId] = useState<string>(
		dbConfigs[0]?.id || ADD_NEW_ID
	);

	const dbConfigByKey = keyBy(dbConfigs, "id");

	const onClickDB: MouseEventHandler<HTMLElement> = (event) => {
		const { itemId = "" } = (
			(event.target as HTMLElement).closest("li") as HTMLLIElement
		).dataset;
		setSelectedDBConfigId(itemId);
	};

	const onClickDelete: MouseEventHandler<SVGSVGElement> = (event) => {
		event.stopPropagation();
		const { itemId = "" } = (
			(event.target as SVGSVGElement).closest("li") as HTMLLIElement
		).dataset;

		if (itemId)
			fireRequest({
				requestType: "DELETE",
				url: `/api/db-config/${itemId}`,
				responseDataKey: "data",
				successCb,
			});
	};

	const onClickSetCurrent: MouseEventHandler<HTMLDivElement> = (event) => {
		event.stopPropagation();
		const { itemId = "" } = (
			(event.target as HTMLDivElement).closest("li") as HTMLLIElement
		).dataset;

		if (itemId) {
			toast.loading(
				`Db config: ${dbConfigByKey[itemId].name} setting active!`,
				{
					id: "db-config-current",
				}
			);
			fireRequest({
				requestType: "POST",
				url: `/api/db-config/current/${itemId}`,
				responseDataKey: "data",
				successCb: () => {
					successCb();
					toast.success(
						`Db config: ${dbConfigByKey[itemId].name} set active!`,
						{
							id: "db-config-current",
						}
					);
				},
				failureCb: (err?: string) => {
					toast.error(
						err ||
							`Db config: ${dbConfigByKey[itemId].name} setting active failed!`,
						{
							id: "db-config-current",
						}
					);
				},
			});
		}
	};

	const items: SideTabItemProps[] = dbConfigs.map((dbConfig) => ({
		id: dbConfig.id,
		name: dbConfig.name,
		badge: dbConfig.environment,
		isCurrent: !!dbConfig.isCurrent,
		enableActiveChange: true,
		enableDeletion: true,
	}));

	items.push({
		id: ADD_NEW_ID,
		name: "Add New",
	});

	return (
		<div
			className={`flex flex-1 h-full border-t border-secondary relative ${isLoading}`}
		>
			<SideTabs
				items={items}
				onClickTab={onClickDB}
				selectedTabId={selectedDBConfigId}
				onClickItemChangeActive={onClickSetCurrent}
				onClickItemDelete={onClickDelete}
			/>
			<div className="flex flex-1 w-full h-full">
				<ModifyDatabaseConfig
					dbConfig={dbConfigByKey[selectedDBConfigId]}
					successCb={successCb}
				/>
			</div>
			{(isLoading || isLoadingList) && (
				<div className="flex absolute w-full left-0 top-0 h-full bg-secondary/[0.1] animate-pulse z-10" />
			)}
		</div>
	);
}

export default function Database() {
	const { data, fireRequest, isFetched, isLoading } = useFetchWrapper();

	const fetchData = async () => {
		fireRequest({
			requestType: "GET",
			url: "/api/db-config",
			responseDataKey: "data",
		});
	};

	useEffect(() => {
		fetchData();
	}, []);

	return !isFetched ? (
		<div className="flex items-center justify-center w-full h-full bg-secondary text-primary animate-pulse">
			Loading...
		</div>
	) : (
		<DatabaseList
			dbConfigs={(data as DBConfig[]) || []}
			successCb={fetchData}
			isLoadingList={isLoading}
		/>
	);
}